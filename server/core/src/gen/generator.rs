use super::super::{
    constants::LEVEL_SEED,
    engine::{chunk::Chunk, registry::Registry, world::WorldConfig},
    gen::builder::VoxelUpdate,
};

use super::biomes::{get_biome_config, BiomeConfig, Biomes, CAVE_SCALE};

use log::debug;
use server_common::{
    noise::{Noise, NoiseConfig},
    vec::Vec3,
};

pub struct Generator;

impl Generator {
    /// Generate a chunk, standalone process, can be run in another thread.
    pub fn generate_chunk(
        chunk: &mut Chunk,
        registry: &Registry,
        biomes: &Biomes,
        config: &WorldConfig,
    ) {
        let Vec3(start_x, start_y, start_z) = chunk.min;
        let Vec3(end_x, end_y, end_z) = chunk.max;

        match config.generation.as_str() {
            "flat" => {
                let types = registry.get_type_map(vec!["Stone", "Stone Bricks"]);

                let is_empty = true;

                let flat_height = 30;

                for vx in start_x..end_x {
                    for vz in start_z..end_z {
                        for vy in start_y..flat_height {
                            if vx % 32 == 0 || vz % 32 == 0 {
                                chunk.set_voxel(vx, vy, vz, types["Stone Bricks"]);
                            } else {
                                chunk.set_voxel(vx, vy, vz, types["Stone"]);
                            }
                        }
                    }
                }

                chunk.is_empty = is_empty;
            }
            "hilly" => {
                let types = registry.get_type_map(vec!["Air", "Grass Block", "Stone", "Dirt"]);

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

                let unit = (config.max_height / config.sub_chunks) as i32;

                let mut pairs = vec![];
                for i in 0..config.sub_chunks as i32 {
                    pairs.push((
                        Vec3(start_x, unit * i, start_z),
                        Vec3(end_x, unit * (i + 1), end_z),
                    ));
                }

                let updates: Vec<Vec<VoxelUpdate>> = pairs
                    .iter()
                    .map(|(start, end)| {
                        let mut updates = vec![];

                        let &Vec3(start_x, start_y, start_z) = start;
                        let &Vec3(end_x, end_y, end_z) = end;

                        let noise = Noise::new(LEVEL_SEED);

                        for vx in start_x..end_x {
                            for vz in start_z..end_z {
                                let (height_offset, biome_config) =
                                    get_biome_config(vx, vz, &noise);

                                for vy in start_y..end_y {
                                    // this is because chunks might come in with preset voxels
                                    if chunk.get_voxel(vx, vy, vz) != 0 {
                                        continue;
                                    }

                                    let vy_ = vy;
                                    let vy = vy - height_offset;

                                    let is_solid = is_solid_at(vx, vy, vz, &biome_config);

                                    if !(is_solid) {
                                        continue;
                                    }

                                    let is_solid_top = is_solid_at(vx, vy + 1, vz, &biome_config);
                                    let is_solid_top2 = is_solid_at(vx, vy + 2, vz, &biome_config);

                                    let vx = vx as f64;
                                    let vy = vy as f64;
                                    let vz = vz as f64;

                                    let y_prop = vy / config.max_height as f64;

                                    let mut block_id: u32;

                                    if !is_solid_top && !is_solid_top2 {
                                        block_id = grass_block;

                                        if noise.fractal_octave_perlin3(
                                            vx,
                                            vy,
                                            vz,
                                            biome_config.scale,
                                            3,
                                        ) > 0.3
                                        {
                                            block_id = dirt;
                                        }
                                    } else {
                                        block_id = stone;
                                    }

                                    // the y_prop is to force the caves lower in the y-axis
                                    // the lower the scale, the bigger the caves
                                    let cave_scale = 0.6;
                                    if noise.simplex3(vx, vy * 0.8, vz, CAVE_SCALE * cave_scale)
                                        * 1.0
                                        / y_prop.powi(3)
                                        > 0.2
                                        && noise.ridged3(vx, vy, vz, CAVE_SCALE * cave_scale * 2.0)
                                            > 0.4
                                    {
                                        block_id = air;
                                    }

                                    updates.push(VoxelUpdate {
                                        voxel: Vec3(vx as i32, vy_ as i32, vz as i32),
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
            }
            "biome_test" => {
                let types =
                    registry.get_type_map(vec!["Water", "Grass Block", "Sand", "Stone", "Dirt"]);

                let is_empty = true;

                let noise = Noise::new(LEVEL_SEED);

                let mut sum = 0.0;
                let mut count = 0.0;

                let mut is_solid_at = |vx: i32, vy: i32, vz: i32, config: &BiomeConfig| {
                    // vy < config.height_offset
                    //     &&
                    let val = noise.octave_simplex3(
                        vx as f64,
                        (vy - config.height_offset) as f64,
                        vz as f64,
                        config.scale,
                        NoiseConfig {
                            octaves: config.octaves,
                            persistence: config.persistence,
                            lacunarity: config.lacunarity,
                            height_scale: config.height_scale,
                            amplifier: config.amplifier,
                        },
                    );

                    sum += val;
                    count += 1.0;

                    val > biomes.configs.solid_threshold
                };

                for vx in start_x..end_x {
                    for vz in start_z..end_z {
                        let biome = biomes.get_biome(vx, vz);

                        let cover = *registry.get_id_by_name(&biome.blocks.cover);

                        for vy in (start_y..end_y).rev() {
                            let is_solid = is_solid_at(vx, vy, vz, &biome.config);

                            if !is_solid && vy < biomes.configs.water_height {
                                chunk.set_voxel(vx, vy, vz, types["Water"]);
                                continue;
                            }

                            if !is_solid {
                                continue;
                            }

                            if chunk.get_voxel(vx, vy + 2, vz) != 0 {
                                chunk.set_voxel(vx, vy, vz, types["Stone"]);
                                continue;
                            }

                            if chunk.get_voxel(vx, vy + 1, vz) != 0 {
                                chunk.set_voxel(vx, vy, vz, types["Dirt"]);
                                continue;
                            }

                            chunk.set_voxel(vx, vy, vz, cover);
                        }
                    }
                }

                chunk.is_empty = is_empty;

                // debug!("average {:?}", sum / count);
            }
            _ => panic!("Generation type not found."),
        }

        chunk.needs_terrain = false;
    }

    /// Generate chunk's height map
    ///
    /// Note: the chunk should already be initialized with voxel data
    pub fn generate_chunk_height_map(chunk: &mut Chunk, registry: &Registry, config: &WorldConfig) {
        let max_height = config.max_height;
        let min = chunk.min.to_owned();
        let max = chunk.max.to_owned();

        for vx in min.0..max.0 {
            for vz in min.2..max.2 {
                for vy in (0..max_height as i32).rev() {
                    let id = chunk.get_voxel(vx, vy, vz);

                    // TODO: CHECK FROM REGISTRY &&&&& PLANTS
                    if vy == 0 || (Generator::check_height(id, registry)) {
                        chunk.set_max_height(vx, vz, vy as u32);
                        break;
                    }
                }
            }
        }
    }

    /// Logic for height map determination
    pub fn check_height(id: u32, registry: &Registry) -> bool {
        !registry.is_air(id) && !registry.is_plant(id) && !registry.is_fluid(id)
    }
}
