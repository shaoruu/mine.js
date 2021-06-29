use std::collections::VecDeque;

use log::debug;

use crate::{
    core::constants::{CHUNK_HORIZONTAL_NEIGHBORS, DATA_PADDING},
    libs::{
        ndarray::{ndarray, Ndarray},
        types::{Block, Coords2, Coords3},
    },
};

use super::{
    chunks::Chunks, constants::VOXEL_NEIGHBORS, registry::Registry, space::Space,
    world::WorldConfig,
};

/// Node of a light propagation queue
#[derive(Debug)]
pub struct LightNode {
    pub voxel: Coords3<i32>,
    pub level: u32,
}

pub struct Lights;

impl Lights {
    // TODO: CHANGE THIS CASTING?

    fn get_sunlight(lights: &Ndarray<u32>, x: i32, y: i32, z: i32) -> u32 {
        let x = x as usize;
        let y = y as usize;
        let z = z as usize;

        if !lights.contains(&[x, y, z]) {
            return 0;
        }

        (lights[&[x, y, z]] >> 4) & 0xf
    }

    fn set_sunlight(lights: &mut Ndarray<u32>, x: i32, y: i32, z: i32, level: u32) {
        let x = x as usize;
        let y = y as usize;
        let z = z as usize;

        if !lights.contains(&[x, y, z]) {
            return;
        }

        lights[&[x, y, z]] = (lights[&[x, y, z]] & 0xf) | (level << 4)
    }

    fn get_torch_light(lights: &Ndarray<u32>, x: i32, y: i32, z: i32) -> u32 {
        let x = x as usize;
        let y = y as usize;
        let z = z as usize;

        if !lights.contains(&[x, y, z]) {
            return 0;
        }

        lights[&[x, y, z]] & 0xf
    }

    fn set_torch_light(lights: &mut Ndarray<u32>, x: i32, y: i32, z: i32, level: u32) {
        let x = x as usize;
        let y = y as usize;
        let z = z as usize;

        if !lights.contains(&[x, y, z]) {
            return;
        }

        lights[&[x, y, z]] = (lights[&[x, y, z]] & 0xf0) | level;
    }

    /// Remove a light source. Steps:
    ///
    /// 1. Remove the existing lights in a flood-fill fashion
    /// 2. If external light source exists, flood fill them back
    pub fn global_remove_light(chunks: &mut Chunks, vx: i32, vy: i32, vz: i32, is_sunlight: bool) {
        let max_height = chunks.config.max_height as i32;
        let max_light_level = chunks.config.max_light_level;

        let mut fill = VecDeque::<LightNode>::new();
        let mut queue = VecDeque::<LightNode>::new();

        queue.push_back(LightNode {
            voxel: Coords3(vx, vy, vz),
            level: if is_sunlight {
                chunks.get_sunlight(vx, vy, vz)
            } else {
                chunks.get_torch_light(vx, vy, vz)
            },
        });

        if is_sunlight {
            chunks.set_sunlight(vx, vy, vz, 0);
        } else {
            chunks.set_torch_light(vx, vy, vz, 0);
        }

        chunks.mark_saving_from_voxel(vx, vy, vz);

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
                    chunks.get_sunlight(nvx, nvy, nvz)
                } else {
                    chunks.get_torch_light(nvx, nvy, nvz)
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
                        chunks.set_sunlight(nvx, nvy, nvz, 0);
                    } else {
                        chunks.set_torch_light(nvx, nvy, nvz, 0);
                    }

                    chunks.mark_saving_from_voxel(nvx, nvy, nvz);
                } else if nl >= level && (!is_sunlight || *oy != -1 || nl > level) {
                    fill.push_back(LightNode {
                        voxel: n_voxel,
                        level: nl,
                    })
                }
            }
        }

        Lights::global_flood_light(chunks, fill, is_sunlight);
    }

    /// Flood fill light from a queue
    pub fn global_flood_light(
        chunks: &mut Chunks,
        mut queue: VecDeque<LightNode>,
        is_sunlight: bool,
    ) {
        let max_height = chunks.config.max_height as i32;
        let max_light_level = chunks.config.max_light_level;

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
                let block_type = chunks.get_block_by_voxel(nvx, nvy, nvz);

                if !block_type.is_transparent
                    || (if is_sunlight {
                        chunks.get_sunlight(nvx, nvy, nvz)
                    } else {
                        chunks.get_torch_light(nvx, nvy, nvz)
                    } >= nl)
                {
                    continue;
                }

                if is_sunlight {
                    chunks.set_sunlight(nvx, nvy, nvz, nl);
                } else {
                    chunks.set_torch_light(nvx, nvy, nvz, nl);
                }

                chunks.mark_saving_from_voxel(nvx, nvy, nvz);

                queue.push_back(LightNode {
                    voxel: n_voxel,
                    level: nl,
                })
            }
        }
    }

    pub fn flood_light(
        mut queue: VecDeque<LightNode>,
        is_sunlight: bool,
        voxels: &Ndarray<u32>,
        lights: &mut Ndarray<u32>,
        registry: &Registry,
        metrics: &WorldConfig,
    ) {
        let max_height = metrics.max_height as i32;
        let max_light_level = metrics.max_light_level;

        // i heard .get() is faster than []
        let shape0 = *voxels.shape.get(0).unwrap() as i32;
        let shape2 = *voxels.shape.get(2).unwrap() as i32;

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

                if nvx < 0 || nvz < 0 || nvx >= shape0 || nvz >= shape2 {
                    continue;
                }

                let sd = is_sunlight && *oy == -1 && level == max_light_level;
                let nl = level - if sd { 0 } else { 1 };
                let n_voxel = Coords3(nvx, nvy, nvz);
                let block_type =
                    registry.get_block_by_id(voxels[&[nvx as usize, nvy as usize, nvz as usize]]);

                if !block_type.is_transparent
                    || (if is_sunlight {
                        Lights::get_sunlight(&lights, nvx, nvy, nvz)
                    } else {
                        Lights::get_torch_light(&lights, nvx, nvy, nvz)
                    } >= nl)
                {
                    continue;
                }

                if is_sunlight {
                    Lights::set_sunlight(lights, nvx, nvy, nvz, nl);
                } else {
                    Lights::set_torch_light(lights, nvx, nvy, nvz, nl);
                }

                queue.push_back(LightNode {
                    voxel: n_voxel,
                    level: nl,
                })
            }
        }
    }

    pub fn propagate(space: &Space, registry: &Registry, config: &WorldConfig) -> Ndarray<u32> {
        let Space {
            width,
            voxels,
            height_map,
        } = space;
        let width = *width;

        let &WorldConfig {
            chunk_size,
            max_height,
            max_light_level,
            ..
        } = config;

        let mut lights = ndarray(voxels.shape.clone(), 0);

        let mut light_queue = VecDeque::<LightNode>::new();
        let mut sunlight_queue = VecDeque::<LightNode>::new();

        for z in 1..(width - 1) as i32 {
            for x in 1..(width - 1) as i32 {
                let h = height_map[&[x as usize, z as usize]] as i32;

                for y in (0..max_height as i32).rev() {
                    let id = voxels[&[x as usize, y as usize, z as usize]];
                    let &Block {
                        is_transparent,
                        is_light,
                        light_level,
                        ..
                    } = registry.get_block_by_id(id);

                    if y > h && is_transparent {
                        Lights::set_sunlight(&mut lights, x, y, z, max_light_level);

                        for [ox, oz] in CHUNK_HORIZONTAL_NEIGHBORS.iter() {
                            let neighbor_id =
                                voxels[&[(x + ox) as usize, y as usize, (z + oz) as usize]];
                            let neighbor_block = registry.get_block_by_id(neighbor_id);

                            if !neighbor_block.is_transparent {
                                continue;
                            }

                            if height_map[&[(x + ox) as usize, (z + oz) as usize]] > y as usize {
                                // means sunlight should propagate here horizontally
                                if !sunlight_queue.iter().any(|LightNode { voxel, .. }| {
                                    voxel.0 == x && voxel.1 == y && voxel.2 == z
                                }) {
                                    sunlight_queue.push_back(LightNode {
                                        level: max_light_level,
                                        voxel: Coords3(x, y, z),
                                    })
                                }
                            }
                        }
                    }

                    if is_light {
                        Lights::set_torch_light(&mut lights, x, y, z, light_level);
                        light_queue.push_back(LightNode {
                            level: light_level,
                            voxel: Coords3(x, y, z),
                        });
                    }
                }
            }
        }

        Lights::flood_light(light_queue, false, &voxels, &mut lights, registry, config);
        Lights::flood_light(sunlight_queue, true, &voxels, &mut lights, registry, config);

        let mut chunk_lights = ndarray(
            vec![
                chunk_size + DATA_PADDING * 2,
                max_height as usize,
                chunk_size + DATA_PADDING * 2,
            ],
            0,
        );

        let margin = (width - chunk_size) / 2;
        for x in (margin - DATA_PADDING)..(margin + chunk_size + DATA_PADDING) {
            for z in (margin - DATA_PADDING)..(margin + chunk_size + DATA_PADDING) {
                for cy in 0..max_height as usize {
                    let cx = x - margin + DATA_PADDING;
                    let cz = z - margin + DATA_PADDING;

                    chunk_lights[&[cx, cy, cz]] = lights[&[x, cy, z]];
                }
            }
        }

        chunk_lights
    }

    pub fn calc_light(space: &Space, registry: &Registry, config: &WorldConfig) -> Ndarray<u32> {
        Lights::propagate(&space, registry, config)
    }
}
