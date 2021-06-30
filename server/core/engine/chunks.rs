#![allow(dead_code)]

// use rayon::prelude::*;
use std::{
    collections::{HashMap, HashSet, VecDeque},
    sync::Arc,
    thread,
    time::Instant,
};

use log::{debug, info};

use rayon::prelude::*;

use crate::{
    core::{
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
            lights::{LightNode, Lights},
            mesher::Mesher,
        },
    },
    libs::{
        noise::Noise,
        types::{Block, Coords2, Coords3},
    },
    utils::convert::{
        get_chunk_name, map_voxel_to_chunk, map_voxel_to_chunk_local, map_world_to_voxel,
    },
};

/// Light data of a single vertex
struct VertexLight {
    count: u32,
    torch_light: u32,
    sunlight: u32,
}

pub enum MeshLevel {
    All,
    Levels(Vec<u32>),
}

/// A wrapper around all the chunks
#[derive(Debug)]
pub struct Chunks {
    pub chunk_cache: HashSet<Coords2<i32>>,
    pub to_generate: Vec<Chunk>,

    pub config: Arc<WorldConfig>,
    pub registry: Arc<Registry>,
    pub builder: Arc<Builder>,

    caching: bool,
    max_loaded_chunks: i32,
    chunks: HashMap<String, Chunk>,
    update_queue: HashMap<Coords2<i32>, Vec<VoxelUpdate>>,
    noise: Noise,
}

/**
 * THIS CODE IS REALLY REALLY BAD
 * NEED REFACTOR ASAP
 */
impl Chunks {
    pub fn new(config: WorldConfig, max_loaded_chunks: i32, registry: Registry) -> Self {
        Chunks {
            chunk_cache: HashSet::new(),

            config: Arc::new(config),
            registry: Arc::new(registry.to_owned()),
            builder: Arc::new(Builder::new(registry, Noise::new(LEVEL_SEED))),

            to_generate: vec![],

            caching: false,
            max_loaded_chunks,
            chunks: HashMap::new(),
            update_queue: HashMap::new(),
            noise: Noise::new(LEVEL_SEED),
        }
    }

    pub fn len(&self) -> usize {
        self.chunks.len()
    }

    /// Return all chunks as raw
    pub fn all(&self) -> Vec<&Chunk> {
        self.chunks.values().collect()
    }

    /// Return a mutable chunk regardless initialization
    pub fn raw(&mut self, coords: &Coords2<i32>) -> Option<&mut Chunk> {
        self.get_chunk_mut(coords)
    }

    /// Return a chunk references only if chunk is fully initialized (generated and decorated)
    pub fn get(
        &mut self,
        coords: &Coords2<i32>,
        dirty_check: bool,
        remesh_level: &MeshLevel,
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

        if !dirty_check || chunk.unwrap().is_dirty {
            self.remesh_chunk(coords, remesh_level);
        }

        self.get_chunk(coords)
    }

    /// To preload chunks surrounding 0,0
    pub fn preload(&mut self, width: i16) {
        self.load(&Coords2(0, 0), width, true);
    }

    /// Generate chunks around a certain coordinate
    pub fn generate(&mut self, coords: &Coords2<i32>, render_radius: i16) {
        let start = Instant::now();

        self.load(coords, render_radius, false);

        info!(
            "Generated chunks surrounding {:?} with radius {} in {:?}",
            coords,
            render_radius,
            start.elapsed()
        );
    }

    pub fn start_caching(&mut self) {
        self.caching = true;
    }

    pub fn stop_caching(&mut self) {
        self.caching = false;
    }

    pub fn clear_cache(&mut self) {
        self.chunk_cache.clear();
    }

    /// Unload chunks when too many chunks are loaded.
    pub fn unload() {
        todo!();
    }

    /// Remesh a chunk, propagating itself and its neighbors then mesh.
    pub fn remesh_chunk(&mut self, coords: &Coords2<i32>, level: &MeshLevel) {
        // let start = Instant::now();
        // propagate light first
        let chunk = self.get_chunk(coords).unwrap();

        // let start = Instant::now();
        if chunk.needs_propagation {
            self.propagate_chunk(coords);
        }

        let sub_chunks = self.config.sub_chunks;

        // TODO: fix this cloning monstrosity
        let metrics = self.config.clone();
        let registry = self.registry.clone();

        match level {
            MeshLevel::All => {
                let chunk = self.get_chunk_mut(coords).unwrap();
                chunk.meshes = Vec::new();

                for sub_chunk in 0..sub_chunks {
                    let chunk = self.get_chunk(coords).unwrap();

                    let opaque = Mesher::mesh_chunk(chunk, false, sub_chunk, &metrics, &registry);
                    let transparent =
                        Mesher::mesh_chunk(chunk, true, sub_chunk, &metrics, &registry);

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

                    let opaque = Mesher::mesh_chunk(chunk, false, sub_chunk, &metrics, &registry);
                    let transparent =
                        Mesher::mesh_chunk(chunk, true, sub_chunk, &metrics, &registry);

                    let chunk = self.get_chunk_mut(coords).unwrap();

                    chunk.meshes[sub_chunk as usize] = Meshes {
                        opaque,
                        transparent,
                        sub_chunk: sub_chunk as i32,
                    };

                    chunk.is_dirty = false;
                    chunk.is_meshed = true;
                }
            }
        };

        // debug!("Meshing took a total of {:?}", start.elapsed());
    }

    /// Load in chunks in two steps:
    ///
    /// 1. Generate the terrain within `terrain_radius`
    /// 2. Populate the terrains within `decorate_radius` with decoration
    ///
    /// Note: `decorate_radius` should always be less than `terrain_radius`
    fn load(&mut self, coords: &Coords2<i32>, render_radius: i16, is_preload: bool) {
        let Coords2(cx, cz) = coords;

        let de = false;

        let mut to_generate: Vec<Chunk> = Vec::new();
        let mut to_decorate: Vec<Coords2<i32>> = Vec::new();

        let terrain_radius = render_radius + 3;
        let decorate_radius = render_radius;

        let start = Instant::now();

        for x in -terrain_radius..=terrain_radius {
            for z in -terrain_radius..=terrain_radius {
                let dist = x * x + z * z;

                if dist >= terrain_radius * terrain_radius {
                    continue;
                }

                let coords = Coords2(cx + x as i32, cz + z as i32);
                let chunk = self.get_chunk(&coords);

                if chunk.is_none() {
                    let mut new_chunk = Chunk::new(
                        coords.to_owned(),
                        self.config.chunk_size,
                        self.config.max_height as usize,
                        self.config.dimension,
                    );

                    if let Some(updates) = self.update_queue.remove(&coords) {
                        for u in updates {
                            new_chunk.set_voxel(u.voxel.0, u.voxel.1, u.voxel.2, u.id);
                        }
                    }

                    to_generate.push(new_chunk);
                }

                if dist <= decorate_radius * decorate_radius {
                    to_decorate.push(coords.to_owned());
                }
            }
        }

        if !is_preload {
            // let the multithreading begin!
            self.to_generate.append(&mut to_generate);
        } else {
            if de {
                debug!("Calculating chunks took {:?}", start.elapsed());
            }

            let start = Instant::now();
            to_generate.par_iter_mut().for_each(|new_chunk| {
                Generator::generate_chunk(new_chunk, &self.registry, &self.config);
            });
            if de {
                debug!("Generating took {:?}", start.elapsed());
            }

            let start = Instant::now();

            to_generate.par_iter_mut().for_each(|chunk| {
                Generator::generate_chunk_height_map(chunk, &self.registry, &self.config);
            });

            for chunk in to_generate {
                self.chunks.insert(chunk.name.to_owned(), chunk);
            }
            if de {
                debug!("Inserting took {:?}", start.elapsed());
            }
        }

        let start = Instant::now();
        let to_decorate: Vec<Chunk> = to_decorate
            .iter()
            .map(|coords| self.chunks.remove(&get_chunk_name(coords.0, coords.1)))
            .flatten()
            .collect();

        let to_decorate_updates: Vec<Vec<VoxelUpdate>> = to_decorate
            .par_iter()
            .map(|chunk| {
                let builder = self.builder.clone();

                if !chunk.needs_decoration {
                    return vec![];
                }

                builder.build(chunk)
            })
            .collect();
        if de {
            debug!("Calculating decoration took {:?}", start.elapsed());
        }

        let start = Instant::now();
        let mut to_decorate_coords = Vec::new();

        for mut chunk in to_decorate {
            let coords = chunk.coords.to_owned();
            chunk.needs_decoration = false;
            self.chunks.insert(chunk.name.to_owned(), chunk);
            to_decorate_coords.push(coords);
        }

        for updates in to_decorate_updates.iter() {
            for u in updates {
                self.set_voxel_by_voxel(u.voxel.0, u.voxel.1, u.voxel.2, u.id);
            }
        }
        if de {
            debug!("Actually decorating took {:?}", start.elapsed());
        }

        let start = Instant::now();
        // dropping in another thread to speed up the process
        thread::spawn(move || drop(to_decorate_updates));
        if de {
            debug!("Dropping in another thread took {:?}", start.elapsed());
        }

        let mut to_decorate: Vec<Chunk> = to_decorate_coords
            .iter()
            .map(|coords| self.chunks.remove(&get_chunk_name(coords.0, coords.1)))
            .flatten()
            .collect();

        to_decorate.par_iter_mut().for_each(|chunk| {
            Generator::generate_chunk_height_map(chunk, &self.registry, &self.config);
        });

        for chunk in to_decorate {
            self.chunks.insert(chunk.name.to_owned(), chunk);
        }

        if de {
            debug!("Generating height map again took {:?}", start.elapsed());
            debug!("");
        }
    }

    /// Populate a chunk with preset decorations.
    fn decorate_chunk(&mut self, coords: &Coords2<i32>) {
        let chunk = self
            .get_chunk_mut(&coords)
            .unwrap_or_else(|| panic!("Chunk not found {:?}", coords));

        if !chunk.needs_decoration {
            return;
        }

        chunk.needs_decoration = false;

        let updates = self.builder.build(self.get_chunk(coords).unwrap());
        updates
            .iter()
            .for_each(|u| self.set_voxel_by_voxel(u.voxel.0, u.voxel.1, u.voxel.2, u.id));
    }

    /// Centered around a coordinate, return 3x3 chunks neighboring the coordinate (not inclusive).
    fn neighbors(&self, Coords2(cx, cz): &Coords2<i32>) -> Vec<Option<&Chunk>> {
        let mut neighbors = Vec::new();

        for x in -1..=1 {
            for z in -1..1 {
                if x == 0 && z == 0 {
                    continue;
                }

                neighbors.push(self.get_chunk(&Coords2(cx + x, cz + z)));
            }
        }

        neighbors
    }

    /// Get a chunk reference from a coordinate
    pub fn get_chunk(&self, coords: &Coords2<i32>) -> Option<&Chunk> {
        let name = get_chunk_name(coords.0, coords.1);
        self.chunks.get(&name)
    }

    /// Get a mutable chunk reference from a coordinate
    pub fn get_chunk_mut(&mut self, coords: &Coords2<i32>) -> Option<&mut Chunk> {
        let name = get_chunk_name(coords.0, coords.1);
        let chunk = self.chunks.get_mut(&name);
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
        let Coords3(vx, vy, vz) = map_world_to_voxel(wx, wy, wz, self.config.dimension);
        self.get_voxel_by_voxel(vx, vy, vz)
    }

    /// Set the voxel type for a voxel coordinate
    pub fn set_voxel_by_voxel(&mut self, vx: i32, vy: i32, vz: i32, id: u32) {
        let chunk = self.get_chunk_by_voxel_mut(vx, vy, vz);

        if let Some(chunk) = chunk {
            chunk.set_voxel(vx, vy, vz, id);
            chunk.is_dirty = true;
        } else {
            let updates = self
                .update_queue
                .entry(map_voxel_to_chunk(vx, vy, vz, self.config.chunk_size))
                .or_insert_with(Vec::new);
            updates.push(VoxelUpdate {
                voxel: Coords3(vx, vy, vz),
                id,
            });
        }

        let neighbors = self.get_neighbor_chunk_coords(vx, vy, vz);
        neighbors.iter().for_each(|c| {
            let n_chunk = self.get_chunk_mut(c);

            if let Some(n_chunk) = n_chunk {
                n_chunk.set_voxel(vx, vy, vz, id);
                n_chunk.is_dirty = true;
            } else {
                let updates = self
                    .update_queue
                    .entry(c.to_owned())
                    .or_insert_with(Vec::new);
                updates.push(VoxelUpdate {
                    voxel: Coords3(vx, vy, vz),
                    id,
                });
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
    pub fn set_sunlight(&mut self, vx: i32, vy: i32, vz: i32, level: u32) {
        let chunk = self
            .get_chunk_by_voxel_mut(vx, vy, vz)
            .expect("Chunk not found.");
        chunk.set_sunlight(vx, vy, vz, level);

        let neighbors = self.get_neighbor_chunk_coords(vx, vy, vz);
        neighbors.iter().for_each(|c| {
            let n_chunk = self.get_chunk_mut(c).unwrap();
            n_chunk.set_sunlight(vx, vy, vz, level);
        })
    }

    /// Get the torch light level at a voxel coordinate
    pub fn get_torch_light(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        let chunk = self.get_chunk_by_voxel(vx, vy, vz);
        if let Some(chunk) = chunk {
            chunk.get_torch_light(vx, vy, vz)
        } else {
            0
        }
    }

    /// Set the torch light level at a voxel coordinate
    pub fn set_torch_light(&mut self, vx: i32, vy: i32, vz: i32, level: u32) {
        let chunk = self
            .get_chunk_by_voxel_mut(vx, vy, vz)
            .expect("Chunk not found.");
        chunk.set_torch_light(vx, vy, vz, level);

        let neighbors = self.get_neighbor_chunk_coords(vx, vy, vz);
        neighbors.iter().for_each(|c| {
            let n_chunk = self.get_chunk_mut(c).unwrap();
            n_chunk.set_torch_light(vx, vy, vz, level);
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
    pub fn get_max_height(&self, vx: i32, vz: i32) -> i32 {
        let chunk = self
            .get_chunk_by_voxel(vx, 0, vz)
            .expect("Chunk not found.");
        chunk.get_max_height(vx, vz)
    }

    /// Set the max height at a voxel column coordinate
    pub fn set_max_height(&mut self, vx: i32, vz: i32, height: i32) {
        let chunk = self
            .get_chunk_by_voxel_mut(vx, 0, vz)
            .expect("Chunk not found.");
        chunk.set_max_height(vx, vz, height);

        let neighbors = self.get_neighbor_chunk_coords(vx, 0, vz);
        neighbors.iter().for_each(|c| {
            let n_chunk = self.get_chunk_mut(c).unwrap();
            n_chunk.set_max_height(vx, vz, height);
            n_chunk.is_dirty = true;
        })
    }

    /// Get neighboring chunks according to a voxel coordinate
    pub fn get_neighbor_chunk_coords(&self, vx: i32, vy: i32, vz: i32) -> HashSet<Coords2<i32>> {
        let chunk_size = self.config.chunk_size;

        let mut neighbor_chunks = HashSet::new();

        let coords = map_voxel_to_chunk(vx, vy, vz, chunk_size);
        let Coords3(lx, _, lz) = map_voxel_to_chunk_local(vx, vy, vz, chunk_size);

        let chunk_size = chunk_size as i32;
        let Coords2(cx, cz) = coords;

        let a = lx <= 0;
        let b = lz <= 0;
        let c = lx >= chunk_size - 1;
        let d = lz >= chunk_size - 1;

        // Direct neighbors
        if a {
            neighbor_chunks.insert(Coords2(cx - 1, cz));
        }
        if b {
            neighbor_chunks.insert(Coords2(cx, cz - 1));
        }
        if c {
            neighbor_chunks.insert(Coords2(cx + 1, cz));
        }
        if d {
            neighbor_chunks.insert(Coords2(cx, cz + 1));
        }

        // Side-to-side diagonals
        if a && b {
            neighbor_chunks.insert(Coords2(cx - 1, cz - 1));
        }
        if a && d {
            neighbor_chunks.insert(Coords2(cx - 1, cz + 1));
        }
        if b && c {
            neighbor_chunks.insert(Coords2(cx + 1, cz - 1));
        }
        if c && d {
            neighbor_chunks.insert(Coords2(cx + 1, cz + 1));
        }

        neighbor_chunks.remove(&coords);

        neighbor_chunks
    }

    pub fn add_chunk(&mut self, chunk: Chunk) {
        self.chunks.insert(chunk.name.to_owned(), chunk);
    }

    /// Update a voxel to a new type
    pub fn update(&mut self, vx: i32, vy: i32, vz: i32, id: u32) {
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

        let voxel = Coords3(vx, vy, vz);

        // updating the new block
        self.set_voxel_by_voxel(vx, vy, vz, id);

        // updating the height map
        if self.registry.is_air(id) {
            if vy == height {
                // on max height, should set max height to lower
                for y in (0..vy).rev() {
                    if y == 0 || !self.registry.is_air(self.get_voxel_by_voxel(vx, y, vz)) {
                        self.set_max_height(vx, vz, y);
                        break;
                    }
                }
            }
        } else if height < vy {
            self.set_max_height(vx, vz, vy);
        }

        // update light levels
        if !needs_propagation {
            if current_type.is_light {
                // remove leftover light
                Lights::global_remove_light(self, vx, vy, vz, false);
            } else if current_type.is_transparent && !updated_type.is_transparent {
                // remove light if solid block is placed
                [false, true].iter().for_each(|&is_sunlight| {
                    let level = if is_sunlight {
                        self.get_sunlight(vx, vy, vz)
                    } else {
                        self.get_torch_light(vx, vy, vz)
                    };
                    if level != 0 {
                        Lights::global_remove_light(self, vx, vy, vz, is_sunlight);
                    }
                });
            }

            if updated_type.is_light {
                // placing a light
                self.set_torch_light(vx, vy, vz, updated_type.light_level);
                Lights::global_flood_light(
                    self,
                    VecDeque::from(vec![LightNode {
                        voxel,
                        level: updated_type.light_level,
                    }]),
                    false,
                );
            } else if updated_type.is_transparent && !current_type.is_transparent {
                // solid block removed
                [false, true].iter().for_each(|&is_sunlight| {
                    let mut queue = VecDeque::<LightNode>::new();

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
                            let n_voxel = Coords3(nvx, nvy, nvz);
                            let &Block {
                                is_light,
                                is_transparent,
                                ..
                            } = self.get_block_by_voxel(nvx, nvy, nvz);

                            // need propagation after solid block removed
                            let level = if is_sunlight {
                                self.get_sunlight(nvx, nvy, nvz)
                            } else {
                                self.get_torch_light(nvx, nvy, nvz)
                            };
                            if level != 0 && (is_transparent || (is_light && !is_sunlight)) {
                                queue.push_back(LightNode {
                                    voxel: n_voxel,
                                    level,
                                })
                            }
                        }
                    }
                    Lights::global_flood_light(self, queue, is_sunlight);
                })
            }
        }
    }

    /// Mark a chunk for saving from a voxel coordinate
    pub fn mark_saving_from_voxel(&mut self, vx: i32, vy: i32, vz: i32) {
        self.get_chunk_by_voxel_mut(vx, vy, vz)
            .unwrap()
            .needs_saving = true;
    }

    /// Propagate light on a chunk. Things this function does:
    ///
    /// 1. Spread sunlight from the very top of the chunk
    /// 2. Recognize the torch lights and flood-fill them as well
    fn propagate_chunk(&mut self, coords: &Coords2<i32>) {
        let max_light_flood = ((self.config.max_light_level as f32) / 2.0).ceil() as usize;

        let space = Space::new(self, coords, max_light_flood);
        let lights = Lights::calc_light(&space, &self.registry, &self.config);

        let chunk = self.get_chunk_mut(coords).expect("Chunk not found");

        chunk.needs_propagation = false;
        chunk.needs_saving = true;
        chunk.set_lights(lights);
    }
}
