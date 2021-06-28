use rayon::prelude::*;

use crate::{
    core::builder::VoxelUpdate,
    libs::{
        noise::{Noise, NoiseConfig},
        types::{Coords3, GenerationType},
    },
};

use super::{
    biomes::{get_biome_config, get_height_within, BiomeConfig, CAVE_SCALE},
    chunk::Chunk,
    constants::LEVEL_SEED,
    registry::Registry,
    world::WorldMetrics,
};

pub struct Generator;

impl Generator {
    pub fn generate_chunk(
        chunk: &mut Chunk,
        generation: GenerationType,
        registry: &Registry,
        metrics: &WorldMetrics,
    ) {
        let Coords3(start_x, start_y, start_z) = chunk.min;
        let Coords3(end_x, _, end_z) = chunk.max;

        match generation {
            GenerationType::FLAT => {
                let types = registry.get_type_map(vec!["Stone", "Stone Brick"]);

                let is_empty = true;

                let flat_height = 30;

                for vx in start_x..end_x {
                    for vz in start_z..end_z {
                        for vy in start_y..flat_height {
                            if vx % 32 == 0 || vz % 32 == 0 {
                                chunk.set_voxel(vx, vy, vz, types["Stone Brick"]);
                            } else {
                                chunk.set_voxel(vx, vy, vz, types["Stone"]);
                            }
                        }
                    }
                }

                chunk.is_empty = is_empty;
            }
            GenerationType::HILLY => {
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
                        // let height_map = get_height_within(start_x, start_z, end_x, end_z, &noise);

                        for vx in start_x..end_x {
                            for vz in start_z..end_z {
                                let (height_offset, biome_config) =
                                    get_biome_config(vx, vz, &noise);

                                for vy in start_y..end_y {
                                    let vy_ = vy;
                                    let vy = vy - height_offset;
                                    // - height_map
                                    //     [&[(vx - start_x) as usize, (vz - start_z) as usize]];

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
            }
        }

        chunk.needs_terrain = false;
    }
}
