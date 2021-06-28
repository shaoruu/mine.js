use std::collections::VecDeque;

use log::debug;

use crate::{
    core::constants::CHUNK_HORIZONTAL_NEIGHBORS,
    libs::{
        ndarray::{ndarray, Ndarray},
        types::{Block, Coords2, Coords3},
    },
};

use super::{
    chunks::Chunks, constants::VOXEL_NEIGHBORS, registry::Registry, space::Space,
    world::WorldMetrics,
};

/// Node of a light propagation queue
#[derive(Debug)]
pub struct LightNode {
    voxel: Coords3<i32>,
    level: u32,
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

    pub fn flood_light(
        mut queue: VecDeque<LightNode>,
        is_sunlight: bool,
        voxels: &Ndarray<u32>,
        lights: &mut Ndarray<u32>,
        registry: &Registry,
        metrics: &WorldMetrics,
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

    pub fn propagate(
        space: &Space,
        registry: &Registry,
        metrics: &WorldMetrics,
        // by how much should the returned data contain other than
        // the chunk's own lighting data.
        padding: usize,
    ) -> Ndarray<u32> {
        let Space {
            width,
            voxels,
            height_map,
        } = space;
        let width = *width;

        let &WorldMetrics {
            chunk_size,
            max_height,
            max_light_level,
            ..
        } = metrics;

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
        }

        Lights::flood_light(light_queue, false, &voxels, &mut lights, registry, metrics);
        Lights::flood_light(
            sunlight_queue,
            true,
            &voxels,
            &mut lights,
            registry,
            metrics,
        );

        let mut chunk_lights = ndarray(
            vec![
                chunk_size + padding * 2,
                max_height as usize,
                chunk_size + padding * 2,
            ],
            0,
        );

        let margin = (width - chunk_size) / 2;
        for x in (margin - padding)..(margin + chunk_size + padding) {
            for z in (margin - padding)..(margin + chunk_size + padding) {
                for cy in 0..max_height as usize {
                    let cx = x - margin + padding;
                    let cz = z - margin + padding;

                    chunk_lights[&[cx, cy, cz]] = lights[&[x, cy, z]];
                }
            }
        }

        chunk_lights
    }

    pub fn calc_light(
        chunks: &Chunks,
        center: Coords2<i32>,
        margin: usize,
        padding: usize,
        registry: &Registry,
        metrics: &WorldMetrics,
    ) -> Ndarray<u32> {
        let space = Space::new(chunks, center, margin);
        Lights::propagate(&space, registry, metrics, padding)
    }
}
