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
    core::{builder::VoxelUpdate, generator::Generator},
    libs::{
        noise::{Noise, NoiseConfig},
        types::{Block, Coords2, Coords3, GenerationType, MeshType, UV},
    },
    utils::convert::{
        get_chunk_name, map_voxel_to_chunk, map_voxel_to_chunk_local, map_world_to_voxel,
    },
};

use super::{
    biomes::{get_biome_config, get_height_within, BiomeConfig, CAVE_SCALE},
    builder::Builder,
    chunk::{Chunk, Meshes},
    constants::{
        BlockFace, CornerData, CornerSimplified, PlantFace, AO_TABLE, BLOCK_FACES,
        CHUNK_HORIZONTAL_NEIGHBORS, CHUNK_NEIGHBORS, LEVEL_SEED, PLANT_FACES, VOXEL_NEIGHBORS,
    },
    registry::{get_texture_type, Registry},
    world::WorldMetrics,
};

/// Node of a light propagation queue
#[derive(Debug)]
struct LightNode {
    voxel: Coords3<i32>,
    level: u32,
}

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
    pub generation: GenerationType,
    pub metrics: WorldMetrics,
    pub registry: Registry,

    caching: bool,
    max_loaded_chunks: i32,
    chunks: HashMap<String, Chunk>,
    noise: Noise,
    builder: Builder,
}

/**
 * THIS CODE IS REALLY REALLY BAD
 * NEED REFACTOR ASAP
 */
impl Chunks {
    pub fn new(
        metrics: WorldMetrics,
        generation: GenerationType,
        max_loaded_chunks: i32,
        registry: Registry,
    ) -> Self {
        Chunks {
            metrics,
            generation,
            registry: registry.to_owned(),
            caching: false,
            max_loaded_chunks,
            chunks: HashMap::new(),
            chunk_cache: HashSet::new(),
            noise: Noise::new(LEVEL_SEED),
            builder: Builder::new(registry, Noise::new(LEVEL_SEED)),
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
        self.load(&Coords2(0, 0), width);
    }

    /// Generate chunks around a certain coordinate
    pub fn generate(&mut self, coords: &Coords2<i32>, render_radius: i16) {
        let start = Instant::now();

        self.load(coords, render_radius);

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

        // propagate neighboring chunks too
        for [ox, oz] in CHUNK_NEIGHBORS.iter() {
            let n_coords = Coords2(coords.0 + ox, coords.1 + oz);
            if self.get_chunk(&n_coords).unwrap().needs_propagation {
                self.propagate_chunk(&n_coords);
            }
        }

        // TODO: MESH HERE (AND SUB MESHES)

        let sub_chunks = self.metrics.sub_chunks;

        match level {
            MeshLevel::All => {
                let chunk = self.get_chunk_mut(coords).unwrap();
                chunk.meshes = Vec::new();

                for sub_chunk in 0..sub_chunks {
                    let opaque = self.mesh_chunk(coords, false, sub_chunk);
                    let transparent = self.mesh_chunk(coords, true, sub_chunk);

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
                    let opaque = self.mesh_chunk(coords, false, sub_chunk);
                    let transparent = self.mesh_chunk(coords, true, sub_chunk);

                    let chunk = self.get_chunk_mut(coords).unwrap();

                    chunk.meshes[sub_chunk as usize] = Meshes {
                        opaque,
                        transparent,
                        sub_chunk: sub_chunk as i32,
                    };

                    chunk.is_dirty = false;
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
    fn load(&mut self, coords: &Coords2<i32>, render_radius: i16) {
        let Coords2(cx, cz) = coords;

        let de = true;

        let mut to_generate: Vec<Chunk> = Vec::new();
        let mut to_decorate: Vec<Coords2<i32>> = Vec::new();

        let terrain_radius = render_radius + 2;
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
                    let new_chunk = Chunk::new(
                        coords.to_owned(),
                        self.metrics.chunk_size,
                        self.metrics.max_height as usize,
                        self.metrics.dimension,
                    );
                    to_generate.push(new_chunk);
                }

                if dist <= decorate_radius * decorate_radius {
                    to_decorate.push(coords.to_owned());
                }
            }
        }

        if de {
            debug!("Calculating chunks took {:?}", start.elapsed());
        }

        let metrics = Arc::new(&self.metrics);
        let registry = Arc::new(&self.registry);

        let start = Instant::now();
        to_generate.par_iter_mut().for_each(|new_chunk| {
            let generation = self.generation.clone();
            Generator::generate_chunk(new_chunk, generation, &registry, &metrics);
        });
        if de {
            debug!("Generating took {:?}", start.elapsed());
        }

        let start = Instant::now();

        to_generate.par_iter_mut().for_each(|chunk| {
            Chunks::generate_chunk_height_map(chunk, &metrics, &registry);
        });

        for chunk in to_generate {
            self.chunks.insert(chunk.name.to_owned(), chunk);
        }
        if de {
            debug!("Inserting took {:?}", start.elapsed());
        }

        let start = Instant::now();
        let to_decorate: Vec<Chunk> = to_decorate
            .iter()
            .map(|coords| {
                self.chunks
                    .remove(&get_chunk_name(coords.0, coords.1))
                    .unwrap()
            })
            .collect();

        let builder = Arc::new(&self.builder);
        let to_decorate_updates: Vec<Vec<VoxelUpdate>> = to_decorate
            .par_iter()
            .map(|chunk| {
                let builder = builder.clone();

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
            .map(|coords| {
                self.chunks
                    .remove(&get_chunk_name(coords.0, coords.1))
                    .unwrap()
            })
            .collect();

        let metrics = Arc::new(&self.metrics);
        let registry = Arc::new(&self.registry);

        to_decorate.par_iter_mut().for_each(|chunk| {
            let metrics = metrics.clone();
            let &metrics = metrics.as_ref();
            let registry = registry.clone();
            let &registry = registry.as_ref();

            Chunks::generate_chunk_height_map(chunk, metrics, registry);
        });

        for mut chunk in to_decorate {
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
        let coords = map_voxel_to_chunk(vx, vy, vz, self.metrics.chunk_size);
        self.get_chunk(&coords)
    }

    /// Get a mutable chunk reference from a voxel coordinate
    pub fn get_chunk_by_voxel_mut(&mut self, vx: i32, vy: i32, vz: i32) -> Option<&mut Chunk> {
        let coords = map_voxel_to_chunk(vx, vy, vz, self.metrics.chunk_size);
        self.get_chunk_mut(&coords)
    }

    /// Get the voxel type at a voxel coordinate
    pub fn get_voxel_by_voxel(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        let chunk = self
            .get_chunk_by_voxel(vx, vy, vz)
            .expect("Chunk not found.");
        chunk.get_voxel(vx, vy, vz)
    }

    /// Get the voxel type at a world coordinate
    pub fn get_voxel_by_world(&self, wx: f32, wy: f32, wz: f32) -> u32 {
        let Coords3(vx, vy, vz) = map_world_to_voxel(wx, wy, wz, self.metrics.dimension);
        self.get_voxel_by_voxel(vx, vy, vz)
    }

    /// Set the voxel type for a voxel coordinate
    pub fn set_voxel_by_voxel(&mut self, vx: i32, vy: i32, vz: i32, id: u32) {
        let chunk = self
            .get_chunk_by_voxel_mut(vx, vy, vz)
            .expect("Chunk not found.");
        chunk.set_voxel(vx, vy, vz, id);
        chunk.is_dirty = true;
    }

    /// Get the sunlight level at a voxel coordinate
    pub fn get_sunlight(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        let chunk = self
            .get_chunk_by_voxel(vx, vy, vz)
            .expect("Chunk not found.");
        chunk.get_sunlight(vx, vy, vz)
    }

    /// Set the sunlight level for a voxel coordinate
    pub fn set_sunlight(&mut self, vx: i32, vy: i32, vz: i32, level: u32) {
        let chunk = self
            .get_chunk_by_voxel_mut(vx, vy, vz)
            .expect("Chunk not found.");
        chunk.set_sunlight(vx, vy, vz, level);
    }

    /// Get the torch light level at a voxel coordinate
    pub fn get_torch_light(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        let chunk = self
            .get_chunk_by_voxel(vx, vy, vz)
            .expect("Chunk not found.");
        chunk.get_torch_light(vx, vy, vz)
    }

    /// Set the torch light level at a voxel coordinate
    pub fn set_torch_light(&mut self, vx: i32, vy: i32, vz: i32, level: u32) {
        let chunk = self
            .get_chunk_by_voxel_mut(vx, vy, vz)
            .expect("Chunk not found.");
        chunk.set_torch_light(vx, vy, vz, level);
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
        chunk.set_max_height(vx, vz, height)
    }

    /// Get neighboring chunks according to a voxel coordinate
    pub fn get_neighbor_chunk_coords(&self, vx: i32, vy: i32, vz: i32) -> HashSet<Coords2<i32>> {
        let chunk_size = self.metrics.chunk_size;

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

        let max_height = self.metrics.max_height as i32;
        let max_light_level = self.metrics.max_light_level;

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
                self.remove_light(vx, vy, vz, false);
            } else if current_type.is_transparent && !updated_type.is_transparent {
                // remove light if solid block is placed
                [false, true].iter().for_each(|&is_sunlight| {
                    let level = if is_sunlight {
                        self.get_sunlight(vx, vy, vz)
                    } else {
                        self.get_torch_light(vx, vy, vz)
                    };
                    if level != 0 {
                        self.remove_light(vx, vy, vz, is_sunlight);
                    }
                });
            }

            if updated_type.is_light {
                // placing a light
                self.set_torch_light(vx, vy, vz, updated_type.light_level);
                self.flood_light(
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
                    self.flood_light(queue, is_sunlight);
                })
            }
        }
    }

    /// Mark a chunk for saving from a voxel coordinate
    fn mark_saving_from_voxel(&mut self, vx: i32, vy: i32, vz: i32) {
        self.get_chunk_by_voxel_mut(vx, vy, vz)
            .unwrap()
            .needs_saving = true;
    }

    /// Generate terrain for a chunk
    fn generate_chunk(chunk: &mut Chunk, types: HashMap<String, u32>, metrics: WorldMetrics) {
        let Coords3(start_x, start_y, start_z) = chunk.min;
        let Coords3(end_x, end_y, end_z) = chunk.max;

        let air = types["Air"];
        let grass_block = types["Grass Block"];
        let stone = types["Stone"];
        let dirt = types["Dirt"];

        let is_empty = true;

        let noise = Noise::new(LEVEL_SEED);

        let is_solid_at = |vx: i32, vy: i32, vz: i32, biome: &BiomeConfig| {
            noise.octave_perlin3(
                vx as f64,
                vy as f64,
                vz as f64,
                biome.scale,
                NoiseConfig {
                    octaves: biome.octaves,
                    persistence: biome.persistence,
                    lacunarity: biome.lacunarity,
                    height_scale: biome.height_scale,
                    amplifier: biome.amplifier,
                },
            ) > -0.2
        };

        let unit = (metrics.max_height / metrics.sub_chunks) as i32;

        let mut pairs = vec![];
        for i in 0..metrics.sub_chunks as i32 {
            pairs.push((
                Coords3(start_x, unit * i, start_z),
                Coords3(end_x, unit * (i + 1), end_z),
            ));
        }

        let updates: Vec<Vec<VoxelUpdate>> = pairs
            .par_iter()
            .map(|(start, end)| {
                let mut updates = vec![];

                let &Coords3(start_x, start_y, start_z) = start;
                let &Coords3(end_x, end_y, end_z) = end;

                let noise = Noise::new(LEVEL_SEED);
                let height_map = get_height_within(start_x, start_z, end_x, end_z, &noise);

                for vx in start_x..end_x {
                    for vz in start_z..end_z {
                        let biome_config = get_biome_config(vx, vz, &noise);

                        for vy in start_y..end_y {
                            let vy_ = vy;
                            let vy = vy
                                - height_map[&[(vx - start_x) as usize, (vz - start_z) as usize]];

                            let is_solid = is_solid_at(vx, vy, vz, &biome_config);

                            if !(is_solid) {
                                continue;
                            }

                            let is_solid_top = is_solid_at(vx, vy + 1, vz, &biome_config);
                            let is_solid_top2 = is_solid_at(vx, vy + 2, vz, &biome_config);

                            let vx = vx as f64;
                            let vy = vy as f64;
                            let vz = vz as f64;

                            let y_prop = vy / metrics.max_height as f64;

                            let mut block_id = air;

                            if !is_solid_top && !is_solid_top2 {
                                block_id = grass_block;

                                if noise.fractal_octave_perlin3(vx, vy, vz, biome_config.scale, 3)
                                    > 0.3
                                {
                                    block_id = dirt;
                                }
                            } else {
                                block_id = stone;
                            }

                            // the y_prop is to force the caves lower in the y-axis
                            // the lower the scale, the bigger the caves
                            let cave_scale = 0.6;
                            if noise.simplex3(vx, vy * 0.8, vz, CAVE_SCALE * cave_scale) * 1.0
                                / y_prop.powi(3)
                                > 0.2
                                && noise.ridged3(vx, vy, vz, CAVE_SCALE * cave_scale * 2.0) > 0.4
                            {
                                block_id = air;
                            }

                            updates.push(VoxelUpdate {
                                voxel: Coords3(vx as i32, vy_ as i32, vz as i32),
                                id: block_id,
                            });
                        }
                    }
                }

                updates
            })
            .collect();

        updates.iter().for_each(|updates| {
            updates.iter().for_each(|u| {
                chunk.set_voxel(u.voxel.0, u.voxel.1, u.voxel.2, u.id);
            })
        });

        chunk.is_empty = is_empty;
        chunk.needs_terrain = false;
    }

    /// Generate chunk's height map
    ///
    /// Note: the chunk should already be initialized with voxel data
    fn generate_chunk_height_map(chunk: &mut Chunk, metrics: &WorldMetrics, registry: &Registry) {
        let size = metrics.chunk_size;
        let max_height = metrics.max_height;

        for lx in 0..size {
            for lz in 0..size {
                for ly in (0..max_height as usize).rev() {
                    let id = chunk.voxels[&[lx, ly, lz]];
                    let ly_i32 = ly as i32;

                    // TODO: CHECK FROM REGISTRY &&&&& PLANTS
                    if ly == 0 || (!registry.is_air(id) && !registry.is_plant(id)) {
                        chunk.height_map[&[lx, lz]] = ly_i32;
                        break;
                    }
                }
            }
        }
    }

    /// Propagate light on a chunk. Things this function does:
    ///
    /// 1. Spread sunlight from the very top of the chunk
    /// 2. Recognize the torch lights and flood-fill them as well
    fn propagate_chunk(&mut self, coords: &Coords2<i32>) {
        let chunk = self.get_chunk_mut(coords).expect("Chunk not found");

        let Coords3(start_x, start_y, start_z) = chunk.min;
        let Coords3(end_x, end_y, end_z) = chunk.max;

        chunk.needs_propagation = false;
        chunk.needs_saving = true;

        let max_light_level = self.metrics.max_light_level;

        let mut light_queue = VecDeque::<LightNode>::new();
        let mut sunlight_queue = VecDeque::<LightNode>::new();

        for vz in start_z..end_z {
            for vx in start_x..end_x {
                let h = self.get_max_height(vx, vz);

                for vy in (start_y..end_y).rev() {
                    let &Block {
                        is_transparent,
                        is_light,
                        light_level,
                        ..
                    } = self.get_block_by_voxel(vx, vy, vz);

                    if vy > h && is_transparent {
                        self.set_sunlight(vx, vy, vz, max_light_level);

                        for [ox, oz] in CHUNK_HORIZONTAL_NEIGHBORS.iter() {
                            let neighbor_block = self.get_block_by_voxel(vx + ox, vy, vz + oz);

                            if !neighbor_block.is_transparent {
                                continue;
                            }

                            if self.get_max_height(vx + ox, vz + oz) > vy {
                                // means sunlight should propagate here horizontally
                                if !sunlight_queue.iter().any(|LightNode { voxel, .. }| {
                                    voxel.0 == vx && voxel.1 == vy && voxel.2 == vz
                                }) {
                                    sunlight_queue.push_back(LightNode {
                                        level: max_light_level,
                                        voxel: Coords3(vx, vy, vz),
                                    })
                                }
                            }
                        }
                    }

                    // ? might be erroneous here, but this is for lights on voxels like plants
                    if is_light {
                        self.set_torch_light(vx, vy, vz, light_level);
                        light_queue.push_back(LightNode {
                            level: light_level,
                            voxel: Coords3(vx, vy, vz),
                        })
                    }
                }
            }
        }

        self.flood_light(light_queue, false);
        self.flood_light(sunlight_queue, true);
    }

    /// Flood fill light from a queue
    fn flood_light(&mut self, mut queue: VecDeque<LightNode>, is_sunlight: bool) {
        let max_height = self.metrics.max_height as i32;
        let max_light_level = self.metrics.max_light_level;

        while !queue.is_empty() {
            let LightNode { voxel, level } = queue.pop_front().unwrap();
            let Coords3(vx, vy, vz) = voxel;

            for [ox, oy, oz] in VOXEL_NEIGHBORS.iter() {
                let nvy = vy + oy;

                if nvy < 0 || nvy > max_height {
                    continue;
                }

                let nvx = vx + ox;
                let nvz = vz + oz;
                let sd = is_sunlight && *oy == -1 && level == max_light_level;
                let nl = level - if sd { 0 } else { 1 };
                let n_voxel = Coords3(nvx, nvy, nvz);
                let block_type = self.get_block_by_voxel(nvx, nvy, nvz);

                if !block_type.is_transparent
                    || (if is_sunlight {
                        self.get_sunlight(nvx, nvy, nvz)
                    } else {
                        self.get_torch_light(nvx, nvy, nvz)
                    } >= nl)
                {
                    continue;
                }

                if is_sunlight {
                    self.set_sunlight(nvx, nvy, nvz, nl);
                } else {
                    self.set_torch_light(nvx, nvy, nvz, nl);
                }

                self.mark_saving_from_voxel(nvx, nvy, nvz);

                queue.push_back(LightNode {
                    voxel: n_voxel,
                    level: nl,
                })
            }
        }
    }

    /// Remove a light source. Steps:
    ///
    /// 1. Remove the existing lights in a flood-fill fashion
    /// 2. If external light source exists, flood fill them back
    fn remove_light(&mut self, vx: i32, vy: i32, vz: i32, is_sunlight: bool) {
        let max_height = self.metrics.max_height as i32;
        let max_light_level = self.metrics.max_light_level;

        let mut fill = VecDeque::<LightNode>::new();
        let mut queue = VecDeque::<LightNode>::new();

        queue.push_back(LightNode {
            voxel: Coords3(vx, vy, vz),
            level: if is_sunlight {
                self.get_sunlight(vx, vy, vz)
            } else {
                self.get_torch_light(vx, vy, vz)
            },
        });

        if is_sunlight {
            self.set_sunlight(vx, vy, vz, 0);
        } else {
            self.set_torch_light(vx, vy, vz, 0);
        }

        self.mark_saving_from_voxel(vx, vy, vz);

        while !queue.is_empty() {
            let LightNode { voxel, level } = queue.pop_front().unwrap();
            let Coords3(vx, vy, vz) = voxel;

            for [ox, oy, oz] in VOXEL_NEIGHBORS.iter() {
                let nvy = vy + oy;

                if nvy < 0 || nvy >= max_height {
                    continue;
                }

                let nvx = vx + ox;
                let nvz = vz + oz;
                let n_voxel = Coords3(nvx, nvy, nvz);

                let nl = if is_sunlight {
                    self.get_sunlight(nvx, nvy, nvz)
                } else {
                    self.get_torch_light(nvx, nvy, nvz)
                };

                if nl == 0 {
                    continue;
                }

                // if level is less, or if sunlight is propagating downwards without stopping
                if nl < level
                    || (is_sunlight
                        && *oy == -1
                        && level == max_light_level
                        && nl == max_light_level)
                {
                    queue.push_back(LightNode {
                        voxel: n_voxel,
                        level: nl,
                    });

                    if is_sunlight {
                        self.set_sunlight(nvx, nvy, nvz, 0);
                    } else {
                        self.set_torch_light(nvx, nvy, nvz, 0);
                    }

                    self.mark_saving_from_voxel(nvx, nvy, nvz);
                } else if nl >= level && (!is_sunlight || *oy != -1 || nl > level) {
                    fill.push_back(LightNode {
                        voxel: n_voxel,
                        level: nl,
                    })
                }
            }
        }

        self.flood_light(fill, is_sunlight);
    }

    /// Meshing a chunk. Poorly written. Needs refactor.
    fn mesh_chunk(
        &self,
        coords: &Coords2<i32>,
        transparent: bool,
        sub_chunk: u32,
    ) -> Option<MeshType> {
        let Chunk {
            min,
            max,
            dimension,
            ..
        } = self.get_chunk(coords).unwrap();

        let WorldMetrics {
            max_height,
            sub_chunks,
            ..
        } = self.metrics;

        let mut positions = Vec::<f32>::new();
        let mut indices = Vec::<i32>::new();
        let mut uvs = Vec::<f32>::new();
        let mut aos = Vec::<f32>::new();
        let mut torch_lights = Vec::<i32>::new();
        let mut sunlights = Vec::<i32>::new();

        let &Coords3(start_x, start_y, start_z) = min;
        let &Coords3(end_x, end_y, end_z) = max;

        let vertex_ao = |side1: u32, side2: u32, corner: u32| -> usize {
            let num_s1 = !self.registry.get_transparency_by_id(side1) as usize;
            let num_s2 = !self.registry.get_transparency_by_id(side2) as usize;
            let num_c = !self.registry.get_transparency_by_id(corner) as usize;

            if num_s1 == 1 && num_s2 == 1 {
                0
            } else {
                3 - (num_s1 + num_s2 + num_c)
            }
        };

        let plant_shrink = 0.6;

        let sub_chunk_unit = max_height / sub_chunks;

        let mut i = 0;
        for vx in start_x..end_x {
            for vz in start_z..end_z {
                for vy in
                    (sub_chunk * sub_chunk_unit) as i32..((sub_chunk + 1) * sub_chunk_unit) as i32
                {
                    let voxel_id = self.get_voxel_by_voxel(vx, vy, vz);
                    let &Block {
                        is_solid,
                        is_transparent,
                        is_block,
                        is_plant,
                        ..
                    } = self.get_block_by_id(voxel_id);

                    // TODO: simplify this logic
                    if (is_solid || is_plant)
                        && (if transparent {
                            is_transparent
                        } else {
                            !is_transparent
                        })
                    {
                        let texture = self.registry.get_texture_by_id(voxel_id);
                        let texture_type = get_texture_type(texture);
                        let uv_map = self.registry.get_uv_by_id(voxel_id);

                        if is_plant {
                            let [dx, dz] = [0, 0];

                            for PlantFace { corners, mat } in PLANT_FACES.iter() {
                                let UV {
                                    start_u,
                                    end_u,
                                    start_v,
                                    end_v,
                                } = uv_map.get(texture.get(*mat).unwrap()).unwrap();
                                let ndx = (positions.len() / 3) as i32;

                                for &CornerSimplified { pos, uv } in corners.iter() {
                                    let offset = (1.0 - plant_shrink) / 2.0;
                                    let pos_x =
                                        pos[0] as f32 * plant_shrink + offset + (vx + dx) as f32;
                                    let pos_y = (pos[1] + vy) as f32;
                                    let pos_z =
                                        pos[2] as f32 * plant_shrink + offset + (vz + dz) as f32;

                                    positions.push(pos_x * *dimension as f32);
                                    positions.push(pos_y * *dimension as f32);
                                    positions.push(pos_z * *dimension as f32);

                                    uvs.push(uv[0] as f32 * (end_u - start_u) + start_u);
                                    uvs.push(uv[1] as f32 * (start_v - end_v) + end_v);

                                    sunlights.push(self.get_sunlight(vx, vy, vz) as i32);
                                    torch_lights.push(self.get_torch_light(vx, vy, vz) as i32);

                                    aos.push(1.0);
                                }

                                indices.push(ndx);
                                indices.push(ndx + 1);
                                indices.push(ndx + 2);
                                indices.push(ndx + 2);
                                indices.push(ndx + 1);
                                indices.push(ndx + 3);

                                i += 4;
                            }
                        } else if is_block {
                            let is_mat_1 = texture_type == "mat1";
                            let is_mat_3 = texture_type == "mat3";

                            for BlockFace {
                                dir,
                                mat3,
                                mat6,
                                corners,
                                neighbors,
                            } in BLOCK_FACES.iter()
                            {
                                let nvx = vx + dir[0];
                                let nvy = vy + dir[1];
                                let nvz = vz + dir[2];

                                let neighbor_id = self.get_voxel_by_voxel(nvx, nvy, nvz);
                                let n_block_type = self.get_block_by_id(neighbor_id);

                                if n_block_type.is_transparent
                                    && (!transparent
                                        || n_block_type.is_empty
                                        || neighbor_id != voxel_id
                                        || (n_block_type.transparent_standalone
                                            && dir[0] + dir[1] + dir[2] >= 1))
                                {
                                    let near_voxels: Vec<u32> = neighbors
                                        .iter()
                                        .map(|[a, b, c]| {
                                            self.get_voxel_by_voxel(vx + a, vy + b, vz + c)
                                        })
                                        .collect();

                                    let UV {
                                        start_u,
                                        end_u,
                                        start_v,
                                        end_v,
                                    } = if is_mat_1 {
                                        uv_map.get(texture.get("all").unwrap()).unwrap()
                                    } else if is_mat_3 {
                                        uv_map.get(texture.get(*mat3).unwrap()).unwrap()
                                    } else {
                                        uv_map.get(texture.get(*mat6).unwrap()).unwrap()
                                    };

                                    let ndx = (positions.len() / 3) as i32;
                                    let mut face_aos = vec![];

                                    let mut four_sunlights = vec![];
                                    let mut four_torch_lights = vec![];

                                    for CornerData {
                                        pos,
                                        uv,
                                        side1,
                                        side2,
                                        corner,
                                    } in corners.iter()
                                    {
                                        let pos_x = pos[0] + vx;
                                        let pos_y = pos[1] + vy;
                                        let pos_z = pos[2] + vz;

                                        positions.push(pos_x as f32 * *dimension as f32);
                                        positions.push(pos_y as f32 * *dimension as f32);
                                        positions.push(pos_z as f32 * *dimension as f32);

                                        uvs.push(uv[0] as f32 * (end_u - start_u) + start_u);
                                        uvs.push(uv[1] as f32 * (start_v - end_v) + end_v);
                                        face_aos.push(
                                            AO_TABLE[vertex_ao(
                                                near_voxels[*side1 as usize],
                                                near_voxels[*side2 as usize],
                                                near_voxels[*corner as usize],
                                            )] / 255.0,
                                        );

                                        // calculating the 8 voxels around this vertex
                                        let dx = pos[0];
                                        let dy = pos[1];
                                        let dz = pos[2];

                                        let dx = if dx == 0 { -1 } else { 1 };
                                        let dy = if dy == 0 { -1 } else { 1 };
                                        let dz = if dz == 0 { -1 } else { 1 };

                                        let mut sum_sunlight = vec![];
                                        let mut sum_torch_light = vec![];

                                        if self.get_block_by_voxel(vx, vy, vz).is_transparent {
                                            sum_sunlight.push(self.get_sunlight(vx, vy, vz));
                                            sum_torch_light.push(self.get_torch_light(vx, vy, vz));
                                        }

                                        if self.get_block_by_voxel(vx, vy, vz + dz).is_transparent {
                                            sum_sunlight.push(self.get_sunlight(vx, vy, vz + dz));
                                            sum_torch_light.push(self.get_torch_light(
                                                vx,
                                                vy,
                                                vz + dz,
                                            ));
                                        }

                                        if self.get_block_by_voxel(vx, vy + dy, vz).is_transparent {
                                            sum_sunlight.push(self.get_sunlight(vx, vy + dy, vz));
                                            sum_torch_light.push(self.get_torch_light(
                                                vx,
                                                vy + dy,
                                                vz,
                                            ));
                                        }

                                        if self
                                            .get_block_by_voxel(vx, vy + dy, vz + dz)
                                            .is_transparent
                                        {
                                            sum_sunlight.push(self.get_sunlight(
                                                vx,
                                                vy + dy,
                                                vz + dz,
                                            ));
                                            sum_torch_light.push(self.get_torch_light(
                                                vx,
                                                vy + dy,
                                                vz + dz,
                                            ));
                                        }

                                        if self.get_block_by_voxel(vx + dx, vy, vz).is_transparent {
                                            sum_sunlight.push(self.get_sunlight(vx + dx, vy, vz));
                                            sum_torch_light.push(self.get_torch_light(
                                                vx + dx,
                                                vy,
                                                vz,
                                            ));
                                        }

                                        if self
                                            .get_block_by_voxel(vx + dx, vy, vz + dz)
                                            .is_transparent
                                        {
                                            sum_sunlight.push(self.get_sunlight(
                                                vx + dx,
                                                vy,
                                                vz + dz,
                                            ));
                                            sum_torch_light.push(self.get_torch_light(
                                                vx + dx,
                                                vy,
                                                vz + dz,
                                            ));
                                        }

                                        if self
                                            .get_block_by_voxel(vx + dx, vy + dy, vz)
                                            .is_transparent
                                        {
                                            sum_sunlight.push(self.get_sunlight(
                                                vx + dx,
                                                vy + dy,
                                                vz,
                                            ));
                                            sum_torch_light.push(self.get_torch_light(
                                                vx + dx,
                                                vy + dy,
                                                vz,
                                            ));
                                        }

                                        if self
                                            .get_block_by_voxel(vx + dx, vy + dy, vz + dz)
                                            .is_transparent
                                        {
                                            sum_sunlight.push(self.get_sunlight(
                                                vx + dx,
                                                vy + dy,
                                                vz + dz,
                                            ));
                                            sum_torch_light.push(self.get_torch_light(
                                                vx + dx,
                                                vy + dy,
                                                vz + dz,
                                            ));
                                        }

                                        four_sunlights.push(
                                            (sum_sunlight.iter().sum::<u32>() as f32
                                                / sum_sunlight.len() as f32)
                                                as i32,
                                        );

                                        four_torch_lights.push(
                                            (sum_torch_light.iter().sum::<u32>() as f32
                                                / sum_torch_light.len() as f32)
                                                as i32,
                                        );
                                    }

                                    let a_t = four_torch_lights[0];
                                    let b_t = four_torch_lights[1];
                                    let c_t = four_torch_lights[2];
                                    let d_t = four_torch_lights[3];

                                    let threshold = 0;

                                    /* -------------------------------------------------------------------------- */
                                    /*                     I KNOW THIS IS UGLY, BUT IT WORKS!                     */
                                    /* -------------------------------------------------------------------------- */
                                    // at least one zero
                                    let one_t0 = a_t <= threshold
                                        || b_t <= threshold
                                        || c_t <= threshold
                                        || d_t <= threshold;
                                    // one is zero, and ao rule, but only for zero AO's
                                    let ozao = a_t + d_t < b_t + c_t
                                        && ((face_aos[0] + face_aos[3])
                                            - (face_aos[1] + face_aos[2]))
                                            .abs()
                                            < f32::EPSILON;
                                    // all not zero, 4 parts
                                    let anzp1 = (b_t as f32 > (a_t + d_t) as f32 / 2.0
                                        && (a_t + d_t) as f32 / 2.0 > c_t as f32)
                                        || (c_t as f32 > (a_t + d_t) as f32 / 2.0
                                            && (a_t + d_t) as f32 / 2.0 > b_t as f32);
                                    // fixed two light sources colliding
                                    let anz = one_t0 && anzp1;

                                    // common starting indices
                                    indices.push(ndx);
                                    indices.push(ndx + 1);

                                    if face_aos[0] + face_aos[3] > face_aos[1] + face_aos[2]
                                        || ozao
                                        || anz
                                    {
                                        // generate flipped quad
                                        indices.push(ndx + 3);
                                        indices.push(ndx + 3);
                                        indices.push(ndx + 2);
                                        indices.push(ndx);
                                    } else {
                                        indices.push(ndx + 2);
                                        indices.push(ndx + 2);
                                        indices.push(ndx + 1);
                                        indices.push(ndx + 3);
                                    }

                                    i += 4;

                                    aos.append(&mut face_aos);
                                    sunlights.append(&mut four_sunlights);
                                    torch_lights.append(&mut &mut four_torch_lights);
                                }
                            }
                        }
                    }
                }
            }
        }

        Some(MeshType {
            aos,
            indices,
            positions,
            sunlights,
            torch_lights,
            uvs,
        })
    }
}
