use std::{
    collections::{HashMap, HashSet, VecDeque},
    path::PathBuf,
    sync::Arc,
};

use crossbeam_channel::{unbounded, Receiver, Sender};
use log::{debug, info};
use rayon::prelude::*;

use crate::gen::{biomes::Biomes, blocks::BlockRotation};

use super::super::{
    constants::{LEVEL_SEED, VOXEL_NEIGHBORS},
    engine::{
        chunk::{Chunk, Meshes},
        registry::Registry,
        space::Space,
        world::WorldConfig,
    },
    gen::{
        builder::{Builder, VoxelUpdate},
        generator::Generator,
        lights::{LightColor, LightNode, Lights},
        mesher::Mesher,
    },
};

use server_common::{
    noise::Noise,
    types::Block,
    vec::{Vec2, Vec3},
};
use server_utils::convert::{map_voxel_to_chunk, map_voxel_to_chunk_local, map_world_to_voxel};

#[derive(Clone, Debug)]
pub enum MeshLevel {
    All,
    None,
    Levels(HashSet<u32>),
}

/// A wrapper around all the chunks
#[derive(Debug)]
pub struct Chunks {
    pub root_folder: PathBuf,
    pub chunk_folder: PathBuf,

    pub chunk_cache: HashSet<Vec2<i32>>,
    pub to_generate: Vec<Chunk>,
    pub generating: HashSet<Vec2<i32>>,
    pub to_mesh: VecDeque<Vec2<i32>>,
    pub meshing: HashSet<Vec2<i32>>,
    pub activities: VecDeque<Vec2<i32>>,

    pub config: Arc<WorldConfig>,
    pub registry: Arc<Registry>,
    pub builder: Arc<Builder>,
    pub biomes: Arc<Biomes>,

    caching: bool,
    chunks: HashMap<Vec2<i32>, Chunk>,
    update_queue: HashMap<Vec2<i32>, Vec<VoxelUpdate>>,
    noise: Noise,

    gen_sender: Arc<Sender<Vec<Chunk>>>,
    gen_receiver: Arc<Receiver<Vec<Chunk>>>,

    mesh_sender: Arc<Sender<Vec<Chunk>>>,
    mesh_receiver: Arc<Receiver<Vec<Chunk>>>,
}

/**
 * THIS CODE IS REALLY REALLY BAD
 * NEED REFACTOR ASAP
 */
impl Chunks {
    pub fn new(world_name: &str, config: WorldConfig, registry: Registry) -> Self {
        let (gen_sender, gen_receiver) = unbounded();
        let gen_sender = Arc::new(gen_sender);
        let gen_receiver = Arc::new(gen_receiver);

        let (mesh_sender, mesh_receiver) = unbounded();
        let mesh_sender = Arc::new(mesh_sender);
        let mesh_receiver = Arc::new(mesh_receiver);

        let mut root_folder = PathBuf::from(&config.chunk_root);
        root_folder.push(world_name);

        let mut chunk_folder = root_folder.clone();
        chunk_folder.push("chunks");

        if config.save {
            std::fs::create_dir_all(&chunk_folder).expect("Unable to create chunks directory...");
            info!(
                "Storage for world \"{}\" is at \"./{}/{}\".",
                world_name, config.chunk_root, world_name
            );
        } else {
            info!("World \"{}\" is temporarily saved in memory.", world_name);
        }

        Chunks {
            root_folder,
            chunk_folder,
            chunk_cache: HashSet::new(),

            config: Arc::new(config),
            registry: Arc::new(registry.to_owned()),
            builder: Arc::new(Builder::new(registry, Noise::new(LEVEL_SEED))),
            biomes: Arc::new(Biomes::default()),

            to_generate: vec![],
            generating: HashSet::new(),
            to_mesh: VecDeque::new(),
            meshing: HashSet::new(),
            activities: VecDeque::new(),

            caching: false,
            chunks: HashMap::new(),
            update_queue: HashMap::new(),
            noise: Noise::new(LEVEL_SEED),

            gen_sender,
            gen_receiver,

            mesh_sender,
            mesh_receiver,
        }
    }

    /// Tick does four things:
    ///
    /// 1. Checks if any chunks needs to be generated. If any is found,
    /// the chunk coordinates are sent to another thread to be generated.
    /// 2. Checks if any thread is waiting to return a generated chunk. If
    /// received any, the new chunk will be added to `chunks` itself.
    /// 3. Checks if any chunks needs to be meshed. If any is found, the chunks
    /// are then sent to another thread to be meshed (lit and culled).
    /// 4. Checks if any thread is waiting to return a meshed chunk. If so, add
    /// them back into `chunks` itself.
    pub fn tick(&mut self) {
        if !self.to_mesh.is_empty() {
            let to_mesh = self
                .to_mesh
                .drain(0..self.config.max_per_thread.min(self.to_mesh.len()))
                .collect::<Vec<_>>();
            let to_mesh: Vec<(Chunk, Space)> = to_mesh
                .iter()
                .map(|coords| {
                    // mark as meshing
                    self.meshing.insert(coords.to_owned());

                    (
                        self.get_chunk(coords).unwrap().clone(),
                        Space::new(self, coords, self.config.max_light_level as usize),
                    )
                })
                .collect();

            let sender = self.mesh_sender.clone();
            let config = self.config.clone();
            let registry = self.registry.clone();

            rayon::spawn(move || {
                let meshed = to_mesh
                    .into_par_iter()
                    .map(|(mut chunk, space)| {
                        if chunk.needs_propagation {
                            let lights = Lights::calc_light(&space, &registry, &config);
                            chunk.needs_propagation = false;
                            chunk.needs_saving = true;
                            chunk.set_lights(lights);
                        }

                        let sub_chunks = config.sub_chunks;

                        chunk.meshes = Vec::new();

                        for sub_chunk in 0..sub_chunks {
                            let opaque =
                                Mesher::mesh_chunk(&chunk, false, sub_chunk, &config, &registry);
                            let transparent =
                                Mesher::mesh_chunk(&chunk, true, sub_chunk, &config, &registry);

                            chunk.meshes.push(Meshes {
                                opaque,
                                transparent,
                                sub_chunk: sub_chunk as i32,
                            });

                            chunk.is_dirty = false;
                        }

                        chunk
                    })
                    .collect();

                sender.send(meshed).unwrap();
            });
        }

        if !self.to_generate.is_empty() {
            let chunks = self
                .to_generate
                .drain(0..self.config.max_per_thread.min(self.to_generate.len()))
                .collect::<Vec<_>>();

            chunks.iter().for_each(|chunk| {
                self.generating.insert(chunk.coords.to_owned());
            });

            let sender = self.gen_sender.clone();
            let config = self.config.clone();
            let registry = self.registry.clone();
            let biomes = self.biomes.clone();

            rayon::spawn(move || {
                let chunks: Vec<Chunk> = chunks
                    .into_par_iter()
                    .map(|mut chunk| {
                        Generator::generate_chunk(&mut chunk, &registry, &biomes, &config);
                        Generator::generate_chunk_height_map(&mut chunk, &registry, &config);
                        chunk
                    })
                    .collect();
                sender.send(chunks).unwrap();
            });
        }

        if let Ok(chunks) = self.mesh_receiver.try_recv() {
            chunks.into_iter().for_each(|c| {
                self.add_chunk(c);
            });
        }

        if let Ok(chunks) = self.gen_receiver.try_recv() {
            chunks.into_iter().for_each(|c| {
                self.add_chunk(c);
            });
        }
    }

    /// Getter for the count of internal chunks
    pub fn len(&self) -> usize {
        self.chunks.len()
    }

    /// Getter for whether there are no chunks loaded
    pub fn is_empty(&self) -> bool {
        self.chunks.is_empty()
    }

    /// Return all chunks as raw
    pub fn all(&self) -> Vec<&Chunk> {
        self.chunks.values().collect()
    }

    /// Return a mutable chunk regardless initialization
    pub fn raw(&self, coords: &Vec2<i32>) -> Option<&Chunk> {
        self.get_chunk(coords)
    }

    /// Return a chunk references only if chunk is fully initialized (generated and decorated)
    pub fn get(
        &mut self,
        coords: &Vec2<i32>,
        remesh_level: &MeshLevel,
        // if it's not urgent, then will be sent to other thread to mesh
        urgent: bool,
    ) -> Option<&Chunk> {
        let chunk = self.get_chunk(coords);
        let neighbors = self.neighbors(coords);

        match chunk {
            None => {
                return None;
            }
            Some(chunk) => {
                if chunk.needs_terrain
                    || chunk.needs_decoration
                    || neighbors.iter().any(|&c| c.is_none())
                    || neighbors.iter().any(|&c| c.unwrap().needs_decoration)
                {
                    return None;
                }
                chunk
            }
        };

        if urgent {
            self.remesh_chunk(coords, remesh_level);
        } else {
            let chunk = chunk.unwrap();
            if chunk.is_dirty {
                let coords = chunk.coords.to_owned();
                if !self.to_mesh.contains(&coords) && !self.meshing.contains(&coords) {
                    self.to_mesh.push_back(coords);
                }
                return None;
            }
        }

        self.get_chunk(coords)
    }

    /// To preload chunks surrounding 0,0
    pub fn preload(&mut self, width: i16) {
        self.generate(&Vec2(0, 0), width, true);
    }

    /// Start the internal cache, caching any mutated chunks.
    pub fn start_caching(&mut self) {
        self.caching = true;
    }

    /// Stop the internal cache
    pub fn stop_caching(&mut self) {
        self.caching = false;
    }

    /// Clear the internal mutated chunks cache
    pub fn clear_cache(&mut self) {
        self.chunk_cache.clear();
    }

    /// Save all chunks to their according JSON files
    pub fn save(&self) {
        // saving the chunks
        self.chunks.values().for_each(|chunk| {
            if chunk.needs_saving {
                chunk.save();
            }
        })
    }

    /// Unload chunks when too many chunks are loaded.
    pub fn unload(&mut self) {
        todo!()
    }

    /// Remesh a chunk, propagating itself and its neighbors then mesh.
    pub fn remesh_chunk(&mut self, coords: &Vec2<i32>, level: &MeshLevel) {
        // let start = Instant::now();
        // propagate light first
        let chunk = self.get_chunk(coords).unwrap();

        // let start = Instant::now();
        if chunk.needs_propagation {
            self.propagate_chunk(coords);
        }

        let sub_chunks = self.config.sub_chunks;

        let config = self.config.clone();
        let registry = self.registry.clone();

        match level {
            MeshLevel::All => {
                let chunk = self.get_chunk_mut(coords).unwrap();
                chunk.meshes = Vec::new();

                for sub_chunk in 0..sub_chunks {
                    let chunk = self.get_chunk(coords).unwrap();

                    let opaque = Mesher::mesh_chunk(chunk, false, sub_chunk, &config, &registry);
                    let transparent =
                        Mesher::mesh_chunk(chunk, true, sub_chunk, &config, &registry);

                    // borrow again in mutable form
                    let chunk = self.get_chunk_mut(coords).unwrap();

                    chunk.meshes.push(Meshes {
                        opaque,
                        transparent,
                        sub_chunk: sub_chunk as i32,
                    });

                    chunk.is_dirty = false;
                }
            }
            MeshLevel::Levels(ls) => {
                for &sub_chunk in ls {
                    let chunk = self.get_chunk_mut(coords).unwrap();

                    let opaque = Mesher::mesh_chunk(chunk, false, sub_chunk, &config, &registry);
                    let transparent =
                        Mesher::mesh_chunk(chunk, true, sub_chunk, &config, &registry);

                    let chunk = self.get_chunk_mut(coords).unwrap();

                    chunk.meshes[sub_chunk as usize] = Meshes {
                        opaque,
                        transparent,
                        sub_chunk: sub_chunk as i32,
                    };

                    chunk.is_dirty = false;
                }
            }
            _ => {}
        };

        // debug!("Meshing took a total of {:?}", start.elapsed());
    }

    /// Load in chunks in two steps:
    ///
    /// 1. Generate the terrain within `terrain_radius`
    /// 2. Populate the terrains within `decorate_radius` with decoration
    ///
    /// Note: `decorate_radius` should always be less than `terrain_radius`
    pub fn generate(&mut self, coords: &Vec2<i32>, render_radius: i16, is_preload: bool) {
        let Vec2(cx, cz) = coords;

        let mut to_generate: Vec<Chunk> = Vec::new();
        let mut to_decorate: Vec<Vec2<i32>> = Vec::new();

        let terrain_radius = render_radius + 3;
        let decorate_radius = render_radius;

        for x in -terrain_radius..=terrain_radius {
            for z in -terrain_radius..=terrain_radius {
                let dist = x * x + z * z;

                if dist >= terrain_radius * terrain_radius {
                    continue;
                }

                let coords = Vec2(cx + x as i32, cz + z as i32);
                let chunk = self.get_chunk(&coords);

                if chunk.is_none() {
                    let index = self.to_generate.iter().position(|c| c.coords.eq(&coords));

                    if index.is_none() {
                        let mut new_chunk =
                            Chunk::new(coords.to_owned(), &self.config, &self.chunk_folder);

                        if let Some(updates) = self.update_queue.remove(&coords) {
                            for u in updates {
                                new_chunk.set_voxel(u.voxel.0, u.voxel.1, u.voxel.2, u.id);
                            }
                        }

                        if new_chunk.needs_terrain {
                            if !self.generating.contains(&new_chunk.coords) {
                                to_generate.push(new_chunk);
                            }
                        } else {
                            self.add_chunk(new_chunk);
                        }
                    }
                }

                if let Some(chunk) = self.get_chunk(&coords) {
                    if chunk.needs_decoration && dist <= decorate_radius * decorate_radius {
                        to_decorate.push(coords.to_owned());
                    }
                }
            }
        }

        if !is_preload {
            // let the multithreading begin!
            self.to_generate.append(&mut to_generate);
            self.to_generate.sort_by(|a, b| {
                let dax = a.coords.0 - coords.0;
                let daz = a.coords.1 - coords.1;
                let dbx = b.coords.0 - coords.0;
                let dbz = b.coords.1 - coords.1;

                let dist_a = dax * dax + daz * daz;
                let dist_b = dbx * dbx + dbz * dbz;

                dist_a.partial_cmp(&dist_b).unwrap()
            })
        } else {
            to_generate.par_iter_mut().for_each(|new_chunk| {
                Generator::generate_chunk(new_chunk, &self.registry, &self.biomes, &self.config);
            });

            to_generate.par_iter_mut().for_each(|chunk| {
                Generator::generate_chunk_height_map(chunk, &self.registry, &self.config);
            });

            for chunk in to_generate {
                self.add_chunk(chunk);
            }
        }

        let to_decorate: Vec<Chunk> = to_decorate
            .iter()
            .map(|coords| self.chunks.remove(&coords))
            .flatten()
            .collect();

        let to_decorate_updates: Vec<Vec<VoxelUpdate>> = to_decorate
            .par_iter()
            .map(|chunk| {
                let builder = self.builder.clone();
                let biomes = self.biomes.clone();

                if !chunk.needs_decoration {
                    return vec![];
                }

                builder.build(chunk, &biomes)
            })
            .collect();

        let mut to_decorate_coords = Vec::new();

        for mut chunk in to_decorate {
            let coords = chunk.coords.to_owned();
            chunk.needs_decoration = false;
            self.add_chunk(chunk);
            to_decorate_coords.push(coords);
        }

        for updates in to_decorate_updates.iter() {
            for u in updates {
                let h = self.get_max_height(u.voxel.0, u.voxel.2) as i32;
                self.set_voxel_by_voxel(u.voxel.0, u.voxel.1, u.voxel.2, u.id);
                if u.voxel.1 > h && Generator::check_height(u.id, &self.registry) {
                    self.set_max_height(u.voxel.0, u.voxel.2, u.voxel.1 as u32);
                }
            }
        }
    }

    /// Centered around a coordinate, return 3x3 chunks neighboring the coordinate (not inclusive).
    fn neighbors(&self, Vec2(cx, cz): &Vec2<i32>) -> Vec<Option<&Chunk>> {
        let mut neighbors = Vec::new();
        let r = (self.config.max_light_level as f32 / self.config.chunk_size as f32).ceil() as i32;

        for x in -r..=r {
            for z in -r..r {
                if x == 0 && z == 0 {
                    continue;
                }

                if x * x + z * z >= r * r {
                    continue;
                }

                neighbors.push(self.get_chunk(&Vec2(cx + x, cz + z)));
            }
        }

        neighbors
    }

    /// Get a chunk reference from a coordinate
    #[inline]
    pub fn get_chunk(&self, coords: &Vec2<i32>) -> Option<&Chunk> {
        self.chunks.get(&coords)
    }

    /// Get a mutable chunk reference from a coordinate
    pub fn get_chunk_mut(&mut self, coords: &Vec2<i32>) -> Option<&mut Chunk> {
        // self.update_activities(coords);

        let chunk = self.chunks.get_mut(&coords);
        // ? does non-mutable chunks need to be cached?
        if self.caching && chunk.is_some() {
            self.chunk_cache.insert(coords.to_owned());
        }

        chunk
    }

    /// Get a chunk reference from a voxel coordinate
    pub fn get_chunk_by_voxel(&self, vx: i32, vy: i32, vz: i32) -> Option<&Chunk> {
        let coords = map_voxel_to_chunk(vx, vy, vz, self.config.chunk_size);
        self.get_chunk(&coords)
    }

    /// Get a mutable chunk reference from a voxel coordinate
    pub fn get_chunk_by_voxel_mut(&mut self, vx: i32, vy: i32, vz: i32) -> Option<&mut Chunk> {
        let coords = map_voxel_to_chunk(vx, vy, vz, self.config.chunk_size);
        self.get_chunk_mut(&coords)
    }

    /// Get the voxel type at a voxel coordinate
    pub fn get_voxel_by_voxel(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        let chunk = self.get_chunk_by_voxel(vx, vy, vz);
        if let Some(chunk) = chunk {
            chunk.get_voxel(vx, vy, vz)
        } else {
            0
        }
    }

    /// Get the voxel type at a world coordinate
    pub fn get_voxel_by_world(&self, wx: f32, wy: f32, wz: f32) -> u32 {
        let Vec3(vx, vy, vz) = map_world_to_voxel(wx, wy, wz, self.config.dimension);
        self.get_voxel_by_voxel(vx, vy, vz)
    }

    /// Set the voxel type for a voxel coordinate
    ///
    /// Note: This clears the voxel rotation and stage.
    ///
    /// Side-effects:
    ///
    /// 1. Sets the neighboring chunk's padding data if the coordinates are on a chunk edge.
    /// 2. Calculates the chunk's and the neighbors' dirty sub-chunk levels
    pub fn set_voxel_by_voxel(&mut self, vx: i32, vy: i32, vz: i32, id: u32) {
        let max_height = self.config.max_height;
        if vy as u32 >= max_height {
            return;
        }

        let sub_chunks = self.config.sub_chunks;
        let chunk = self.get_chunk_by_voxel_mut(vx, vy, vz);

        if let Some(chunk) = chunk {
            chunk.set_voxel(vx, vy, vz, id);
            chunk.calc_dirty_levels(vy, max_height, sub_chunks);
            chunk.is_dirty = true;
        } else {
            let updates = self
                .update_queue
                .entry(map_voxel_to_chunk(vx, vy, vz, self.config.chunk_size))
                .or_insert_with(Vec::new);
            updates.push(VoxelUpdate {
                voxel: Vec3(vx, vy, vz),
                id,
            });
        }

        let neighbors = self.get_neighbor_chunk_coords(vx, vy, vz);
        neighbors.iter().for_each(|c| {
            let n_chunk = self.get_chunk_mut(c);

            if let Some(n_chunk) = n_chunk {
                n_chunk.set_voxel(vx, vy, vz, id);
                n_chunk.calc_dirty_levels(vy, max_height, sub_chunks);
                n_chunk.is_dirty = true;
            } else {
                let updates = self
                    .update_queue
                    .entry(c.to_owned())
                    .or_insert_with(Vec::new);
                updates.push(VoxelUpdate {
                    voxel: Vec3(vx, vy, vz),
                    id,
                });
            }
        })
    }

    /// Get the voxel rotation at a voxel coordinate
    pub fn get_voxel_rotation_by_voxel(&self, vx: i32, vy: i32, vz: i32) -> BlockRotation {
        let chunk = self.get_chunk_by_voxel(vx, vy, vz);
        if let Some(chunk) = chunk {
            chunk.get_voxel_rotation(vx, vy, vz)
        } else {
            panic!("Rotation not obtainable.");
        }
    }

    /// Set the voxel rotation at a voxel coordinate
    ///
    /// Side-effects:
    ///
    /// 1. Sets the neighboring chunk's padding data if the coordinates are on a chunk edge.
    /// 2. Calculates the chunk's and the neighbors' dirty sub-chunk levels
    pub fn set_voxel_rotation_by_voxel(
        &mut self,
        vx: i32,
        vy: i32,
        vz: i32,
        rotation: &BlockRotation,
    ) {
        let max_height = self.config.max_height;
        if vy as u32 >= max_height {
            return;
        }

        let sub_chunks = self.config.sub_chunks;
        let chunk = self.get_chunk_by_voxel_mut(vx, vy, vz);

        // TODO: update chunks data for unloaded chunks.

        if let Some(chunk) = chunk {
            chunk.set_voxel_rotation(vx, vy, vz, rotation);
            chunk.calc_dirty_levels(vy, max_height, sub_chunks);
            chunk.is_dirty = true;
        }

        let neighbors = self.get_neighbor_chunk_coords(vx, vy, vz);
        neighbors.iter().for_each(|c| {
            let n_chunk = self.get_chunk_mut(c);

            if let Some(n_chunk) = n_chunk {
                n_chunk.set_voxel_rotation(vx, vy, vz, rotation);
                n_chunk.calc_dirty_levels(vy, max_height, sub_chunks);
                n_chunk.is_dirty = true;
            }
        })
    }

    /// Get the voxel stage at a voxel coordinate
    pub fn get_voxel_stage_by_voxel(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        let chunk = self.get_chunk_by_voxel(vx, vy, vz);
        if let Some(chunk) = chunk {
            chunk.get_voxel_stage(vx, vy, vz)
        } else {
            panic!("Stage not obtainable.");
        }
    }

    /// Set the voxel stage at a voxel coordinate
    ///
    /// Side-effects:
    ///
    /// 1. Sets the neighboring chunk's padding data if the coordinates are on a chunk edge.
    /// 2. Calculates the chunk's and the neighbors' dirty sub-chunk levels
    pub fn set_voxel_stage_by_voxel(&mut self, vx: i32, vy: i32, vz: i32, stage: u32) {
        let max_height = self.config.max_height;
        if vy as u32 >= max_height {
            return;
        }

        let sub_chunks = self.config.sub_chunks;
        let chunk = self.get_chunk_by_voxel_mut(vx, vy, vz);

        // TODO: update chunks data for unloaded chunks.

        if let Some(chunk) = chunk {
            chunk.set_voxel_stage(vx, vy, vz, stage);
            chunk.calc_dirty_levels(vy, max_height, sub_chunks);
            chunk.is_dirty = true;
        }

        let neighbors = self.get_neighbor_chunk_coords(vx, vy, vz);
        neighbors.iter().for_each(|c| {
            let n_chunk = self.get_chunk_mut(c);

            if let Some(n_chunk) = n_chunk {
                n_chunk.set_voxel_stage(vx, vy, vz, stage);
                n_chunk.calc_dirty_levels(vy, max_height, sub_chunks);
                n_chunk.is_dirty = true;
            }
        })
    }

    /// Get the sunlight level at a voxel coordinate
    pub fn get_sunlight(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        let chunk = self.get_chunk_by_voxel(vx, vy, vz);
        if let Some(chunk) = chunk {
            chunk.get_sunlight(vx, vy, vz)
        } else {
            0
        }
    }

    /// Set the sunlight level for a voxel coordinate
    ///
    /// Side-effects:
    ///
    /// 1. Sets the neighboring chunk's padding data if the coordinates are on a chunk edge.
    /// 2. Calculates the chunk's and the neighbors' dirty sub-chunk levels
    pub fn set_sunlight(&mut self, vx: i32, vy: i32, vz: i32, level: u32) {
        let max_height = self.config.max_height;
        if vy as u32 >= max_height {
            return;
        }

        let sub_chunks = self.config.sub_chunks;

        let chunk = self
            .get_chunk_by_voxel_mut(vx, vy, vz)
            .expect("Chunk not found.");

        chunk.set_sunlight(vx, vy, vz, level);
        chunk.calc_dirty_levels(vy, max_height, sub_chunks);
        chunk.is_dirty = true;

        let neighbors = self.get_neighbor_chunk_coords(vx, vy, vz);
        neighbors.iter().for_each(|c| {
            let n_chunk = self.get_chunk_mut(c).unwrap();

            n_chunk.set_sunlight(vx, vy, vz, level);
            n_chunk.calc_dirty_levels(vy, max_height, sub_chunks);
            n_chunk.is_dirty = true;
        })
    }

    /// Get the torch light level by voxel coordinates of a specified color
    pub fn get_torch_light(&self, vx: i32, vy: i32, vz: i32, color: &LightColor) -> u32 {
        let chunk = self.get_chunk_by_voxel(vx, vy, vz);
        if let Some(chunk) = chunk {
            chunk.get_torch_light(vx, vy, vz, color)
        } else {
            0
        }
    }

    /// Set the torch light level by voxel coordinates of a specified color
    ///
    /// Side-effects:
    ///
    /// 1. Sets the neighboring chunk's padding data if the coordinates are on a chunk edge.
    /// 2. Calculates the chunk's and the neighbors' dirty sub-chunk levels
    pub fn set_torch_light(&mut self, vx: i32, vy: i32, vz: i32, level: u32, color: &LightColor) {
        let max_height = self.config.max_height;
        if vy as u32 >= max_height {
            return;
        }

        let sub_chunks = self.config.sub_chunks;

        let chunk = self
            .get_chunk_by_voxel_mut(vx, vy, vz)
            .expect("Chunk not found.");

        chunk.set_torch_light(vx, vy, vz, level, color);
        chunk.calc_dirty_levels(vy, max_height, sub_chunks);
        chunk.is_dirty = true;

        let neighbors = self.get_neighbor_chunk_coords(vx, vy, vz);
        neighbors.iter().for_each(|c| {
            let n_chunk = self.get_chunk_mut(c).unwrap();

            n_chunk.set_torch_light(vx, vy, vz, level, color);
            n_chunk.calc_dirty_levels(vy, max_height, sub_chunks);
            n_chunk.is_dirty = true;
        })
    }

    /// Get a block type from a voxel coordinate
    pub fn get_block_by_voxel(&self, vx: i32, vy: i32, vz: i32) -> &Block {
        let voxel = self.get_voxel_by_voxel(vx, vy, vz);
        self.registry.get_block_by_id(voxel)
    }

    /// Get a block type from a voxel id
    pub fn get_block_by_id(&self, id: u32) -> &Block {
        self.registry.get_block_by_id(id)
    }

    /// Get the max height at a voxel column coordinate
    pub fn get_max_height(&self, vx: i32, vz: i32) -> u32 {
        if let Some(chunk) = self.get_chunk_by_voxel(vx, 0, vz) {
            chunk.get_max_height(vx, vz)
        } else {
            0
        }
    }

    /// Set the max height at a voxel column coordinate
    pub fn set_max_height(&mut self, vx: i32, vz: i32, height: u32) {
        // this is reasonable because if a chunk DNE, and gets instantiated later on,
        // max height will be generated on instantiation too.
        if let Some(chunk) = self.get_chunk_by_voxel_mut(vx, 0, vz) {
            chunk.set_max_height(vx, vz, height);
        }

        let neighbors = self.get_neighbor_chunk_coords(vx, 0, vz);
        neighbors.iter().for_each(|c| {
            if let Some(n_chunk) = self.get_chunk_mut(c) {
                n_chunk.set_max_height(vx, vz, height);
                n_chunk.is_dirty = true;
            }
        })
    }

    /// Get whether a voxel is walkable
    pub fn get_walkable_by_voxel(&self, vx: i32, vy: i32, vz: i32) -> bool {
        let block = self
            .registry
            .get_block_by_id(self.get_voxel_by_voxel(vx, vy, vz));
        !block.is_solid || block.is_plant
    }

    /// Get whether a voxel is solid
    pub fn get_solidity_by_voxel(&self, vx: i32, vy: i32, vz: i32) -> bool {
        self.get_voxel_by_voxel(vx, vy, vz) != 0
    }

    /// Get whether a voxel is fluid
    pub fn get_fluidity_by_voxel(&self, _vx: i32, _vy: i32, _vz: i32) -> bool {
        // TODO: ADD FLUIDS
        false
    }

    /// Get neighboring chunks according to a voxel coordinate
    pub fn get_neighbor_chunk_coords(&self, vx: i32, vy: i32, vz: i32) -> HashSet<Vec2<i32>> {
        let chunk_size = self.config.chunk_size;

        let mut neighbor_chunks = HashSet::new();

        let coords = map_voxel_to_chunk(vx, vy, vz, chunk_size);
        let Vec3(lx, _, lz) = map_voxel_to_chunk_local(vx, vy, vz, chunk_size);

        let chunk_size = chunk_size as i32;
        let Vec2(cx, cz) = coords;

        let a = lx <= 0;
        let b = lz <= 0;
        let c = lx >= chunk_size - 1;
        let d = lz >= chunk_size - 1;

        // Direct neighbors
        if a {
            neighbor_chunks.insert(Vec2(cx - 1, cz));
        }
        if b {
            neighbor_chunks.insert(Vec2(cx, cz - 1));
        }
        if c {
            neighbor_chunks.insert(Vec2(cx + 1, cz));
        }
        if d {
            neighbor_chunks.insert(Vec2(cx, cz + 1));
        }

        // Side-to-side diagonals
        if a && b {
            neighbor_chunks.insert(Vec2(cx - 1, cz - 1));
        }
        if a && d {
            neighbor_chunks.insert(Vec2(cx - 1, cz + 1));
        }
        if b && c {
            neighbor_chunks.insert(Vec2(cx + 1, cz - 1));
        }
        if c && d {
            neighbor_chunks.insert(Vec2(cx + 1, cz + 1));
        }

        neighbor_chunks.remove(&coords);

        neighbor_chunks
    }

    /// Get the voxel above the first standable block below
    pub fn get_standable_voxel(&self, voxel: &Vec3<i32>) -> Vec3<i32> {
        let mut voxel = voxel.clone();
        loop {
            if voxel.1 == 0 || self.get_walkable_by_voxel(voxel.0, voxel.1, voxel.2) {
                voxel.1 -= 1;
            } else {
                break;
            }
        }
        voxel.1 += 1;
        voxel
    }

    /// Add a chunk instance to self
    ///
    /// Removes existing chunks first.
    pub fn add_chunk(&mut self, chunk: Chunk) {
        self.meshing.remove(&chunk.coords);
        self.generating.remove(&chunk.coords);

        self.update_activities(&chunk.coords);

        self.chunks.remove(&chunk.coords);
        self.chunks.insert(chunk.coords.to_owned(), chunk);

        self.unload_chunks();
    }

    /// Update a voxel to a new type
    pub fn update(&mut self, vx: i32, vy: i32, vz: i32, id: u32, rotation: u32, y_rotation: u32) {
        // TODO: fix this code (might have better way)
        self.get_chunk_by_voxel_mut(vx, vy, vz)
            .unwrap()
            .needs_saving = true;
        let needs_propagation = self
            .get_chunk_by_voxel(vx, vy, vz)
            .unwrap()
            .needs_propagation;

        let max_height = self.config.max_height as i32;
        let max_light_level = self.config.max_light_level;

        let height = self.get_max_height(vx, vz);

        // TODO: better way? RefCell?
        let current_type = self.get_block_by_voxel(vx, vy, vz).clone();
        let updated_type = self.get_block_by_id(id).clone();

        let voxel = Vec3(vx, vy, vz);

        // updating the new block
        self.set_voxel_by_voxel(vx, vy, vz, id);

        if updated_type.rotatable {
            let y_rotation = if updated_type.y_rotatable {
                y_rotation
            } else {
                0
            };

            self.set_voxel_rotation_by_voxel(
                vx,
                vy,
                vz,
                &BlockRotation::encode(rotation, y_rotation),
            );
        }

        // updating the height map
        if self.registry.is_air(id) {
            if vy == height as i32 {
                // on max height, should set max height to lower
                for y in (0..vy).rev() {
                    if y == 0
                        || Generator::check_height(
                            self.get_voxel_by_voxel(vx, y, vz),
                            &self.registry,
                        )
                    {
                        self.set_max_height(vx, vz, y as u32);
                        break;
                    }
                }
            }
        } else if height < vy as u32 {
            self.set_max_height(vx, vz, vy as u32);
        }

        const RED: LightColor = LightColor::Red;
        const GREEN: LightColor = LightColor::Green;
        const BLUE: LightColor = LightColor::Blue;
        const NONE: LightColor = LightColor::None;

        // update light levels
        if !needs_propagation {
            if current_type.is_light {
                // remove leftover light
                Lights::global_remove_light(self, vx, vy, vz, false, &RED);
                Lights::global_remove_light(self, vx, vy, vz, false, &GREEN);
                Lights::global_remove_light(self, vx, vy, vz, false, &BLUE);
            } else if current_type.is_transparent && !updated_type.is_transparent {
                // remove light if solid block is placed
                [false, true].iter().for_each(|&is_sunlight| {
                    if is_sunlight {
                        if self.get_sunlight(vx, vy, vz) != 0 {
                            Lights::global_remove_light(self, vx, vy, vz, is_sunlight, &NONE);
                        }
                    } else {
                        if self.get_torch_light(vx, vy, vz, &RED) != 0 {
                            Lights::global_remove_light(self, vx, vy, vz, is_sunlight, &RED);
                        }
                        if self.get_torch_light(vx, vy, vz, &GREEN) != 0 {
                            Lights::global_remove_light(self, vx, vy, vz, is_sunlight, &GREEN);
                        }
                        if self.get_torch_light(vx, vy, vz, &BLUE) != 0 {
                            Lights::global_remove_light(self, vx, vy, vz, is_sunlight, &BLUE);
                        }
                    };
                });
            }

            if updated_type.is_light {
                // placing a light

                if updated_type.red_light_level > 0 {
                    self.set_torch_light(vx, vy, vz, updated_type.red_light_level, &RED);

                    Lights::global_flood_light(
                        self,
                        VecDeque::from(vec![LightNode {
                            voxel: voxel.clone(),
                            level: updated_type.red_light_level,
                        }]),
                        false,
                        &RED,
                    );
                }

                if updated_type.green_light_level > 0 {
                    self.set_torch_light(vx, vy, vz, updated_type.green_light_level, &GREEN);

                    Lights::global_flood_light(
                        self,
                        VecDeque::from(vec![LightNode {
                            voxel: voxel.clone(),
                            level: updated_type.green_light_level,
                        }]),
                        false,
                        &GREEN,
                    );
                }

                if updated_type.blue_light_level > 0 {
                    self.set_torch_light(vx, vy, vz, updated_type.blue_light_level, &BLUE);

                    Lights::global_flood_light(
                        self,
                        VecDeque::from(vec![LightNode {
                            voxel,
                            level: updated_type.blue_light_level,
                        }]),
                        false,
                        &BLUE,
                    );
                }
            } else if updated_type.is_transparent && !current_type.is_transparent {
                // solid block removed
                [false, true].iter().for_each(|&is_sunlight| {
                    let mut queue = VecDeque::<LightNode>::new();
                    let mut red_queue = VecDeque::<LightNode>::new();
                    let mut green_queue = VecDeque::<LightNode>::new();
                    let mut blue_queue = VecDeque::<LightNode>::new();

                    if is_sunlight && vy == max_height - 1 {
                        // propagate sunlight down
                        self.set_sunlight(vx, vy, vz, max_light_level);
                        queue.push_back(LightNode {
                            voxel: voxel.clone(),
                            level: max_light_level,
                        })
                    } else {
                        for [ox, oy, oz] in VOXEL_NEIGHBORS.iter() {
                            let nvy = vy + oy;

                            if nvy < 0 || nvy >= max_height {
                                return;
                            }

                            let nvx = vx + ox;
                            let nvz = vz + oz;
                            let n_voxel = Vec3(nvx, nvy, nvz);
                            let &Block {
                                is_light,
                                is_transparent,
                                ..
                            } = self.get_block_by_voxel(nvx, nvy, nvz);

                            // need propagation after solid block removed
                            if is_sunlight {
                                let level = self.get_sunlight(nvx, nvy, nvz);
                                if level != 0 && is_transparent {
                                    queue.push_back(LightNode {
                                        voxel: n_voxel,
                                        level,
                                    })
                                }
                            } else {
                                let red_level = self.get_torch_light(nvx, nvy, nvz, &RED);
                                if red_level != 0 && (is_transparent || is_light) {
                                    red_queue.push_back(LightNode {
                                        voxel: n_voxel.clone(),
                                        level: red_level,
                                    })
                                }

                                let green_level = self.get_torch_light(nvx, nvy, nvz, &GREEN);
                                if green_level != 0 && (is_transparent || is_light) {
                                    green_queue.push_back(LightNode {
                                        voxel: n_voxel.clone(),
                                        level: green_level,
                                    })
                                }

                                let blue_level = self.get_torch_light(nvx, nvy, nvz, &BLUE);
                                if blue_level != 0 && (is_transparent || is_light) {
                                    blue_queue.push_back(LightNode {
                                        voxel: n_voxel,
                                        level: blue_level,
                                    })
                                }
                            }
                        }
                    }

                    if is_sunlight {
                        Lights::global_flood_light(self, queue, is_sunlight, &NONE);
                    } else {
                        Lights::global_flood_light(self, red_queue, is_sunlight, &RED);
                        Lights::global_flood_light(self, green_queue, is_sunlight, &GREEN);
                        Lights::global_flood_light(self, blue_queue, is_sunlight, &BLUE);
                    }
                })
            }
        }
    }

    /// Mark a chunk for saving from a voxel coordinate
    pub fn mark_saving_from_voxel(&mut self, vx: i32, vy: i32, vz: i32) {
        self.get_chunk_by_voxel_mut(vx, vy, vz)
            .unwrap()
            .needs_saving = true;

        let neighbors = self.get_neighbor_chunk_coords(vx, vy, vz);
        neighbors.iter().for_each(|n_coords| {
            if let Some(chunk) = self.get_chunk_mut(n_coords) {
                chunk.needs_saving = true;
            }
        })
    }

    /// Propagate light on a chunk. Things this function does:
    ///
    /// 1. Spread sunlight from the very top of the chunk
    /// 2. Recognize the torch lights and flood-fill them as well
    fn propagate_chunk(&mut self, coords: &Vec2<i32>) {
        let max_light_flood = self.config.max_light_level as usize;

        let space = Space::new(self, coords, max_light_flood);
        let lights = Lights::calc_light(&space, &self.registry, &self.config);

        let chunk = self.get_chunk_mut(coords).expect("Chunk not found");

        chunk.needs_propagation = false;
        chunk.needs_saving = true;
        chunk.set_lights(lights);
    }

    /// Update the activities of chunks
    fn update_activities(&mut self, coords: &Vec2<i32>) {
        if let Some(index) = self.activities.iter().position(|c| *c == *coords) {
            self.activities.remove(index);
        }

        self.activities.push_back(coords.to_owned());
    }

    /// Unload chunks that are too old.
    fn unload_chunks(&mut self) {
        let diff = self.chunks.len() as i32 - self.config.max_loaded_chunks as i32;

        if diff > 0 {
            for _ in 0..diff {
                if let Some(coords) = self.activities.pop_front() {
                    if let Some(chunk) = self.chunks.remove(&coords) {
                        if self.config.save {
                            chunk.save();
                        }
                    }
                }
            }
        }
    }
}
