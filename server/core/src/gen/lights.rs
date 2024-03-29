use std::collections::VecDeque;

use super::super::{
    constants::{CHUNK_HORIZONTAL_NEIGHBORS, DATA_PADDING, VOXEL_NEIGHBORS},
    engine::{chunks::Chunks, registry::Registry, space::Space, world::WorldConfig},
};

use server_common::{
    ndarray::{ndarray, Ndarray},
    types::Block,
    vec::Vec3,
};

/// Node of a light propagation queue
#[derive(Debug)]
pub struct LightNode {
    pub voxel: Vec3<i32>,
    pub level: u32,
}

/// Enum of light colors
///
/// `None` being sunlight
pub enum LightColor {
    None,
    Red,
    Green,
    Blue,
}

pub struct Lights;

impl Lights {
    /// Extract the bits in light that stores sunlight
    #[inline]
    pub fn extract_sunlight(light: u32) -> u32 {
        (light >> 12) & 0xF
    }

    /// Insert a value into the bits in light that stores sunlight
    #[inline]
    pub fn insert_sunlight(light: u32, level: u32) -> u32 {
        (light & 0xFFF) | (level << 12)
    }

    /// Extract the bits in light that stores red light
    #[inline]
    pub fn extract_red_light(light: u32) -> u32 {
        (light >> 8) & 0xF
    }

    /// Insert a value into the bits in light that stores red light
    #[inline]
    pub fn insert_red_light(light: u32, level: u32) -> u32 {
        (light & 0xF0FF) | (level << 8)
    }

    /// Extract the bits in light that stores green light
    #[inline]
    pub fn extract_green_light(light: u32) -> u32 {
        (light >> 4) & 0xF
    }

    /// Insert a value into the bits in light that stores green light
    #[inline]
    pub fn insert_green_light(light: u32, level: u32) -> u32 {
        (light & 0xFF0F) | (level << 4)
    }

    /// Extract the bits in light that stores blue light
    #[inline]
    pub fn extract_blue_light(light: u32) -> u32 {
        light & 0xF
    }

    /// Insert a value into the bits in light that stores blue light
    #[inline]
    pub fn insert_blue_light(light: u32, level: u32) -> u32 {
        (light & 0xFFF0) | (level)
    }

    /// Getter for sunlight by arbitrary coordinates
    fn get_sunlight(lights: &Ndarray<u32>, x: i32, y: i32, z: i32) -> u32 {
        let x = x as usize;
        let y = y as usize;
        let z = z as usize;

        if !lights.contains(&[x, y, z]) {
            return 0;
        }

        Lights::extract_sunlight(lights[&[x, y, z]])
    }

    /// Setter for sunlight by arbitrary coordinates
    fn set_sunlight(lights: &mut Ndarray<u32>, x: i32, y: i32, z: i32, level: u32) {
        let x = x as usize;
        let y = y as usize;
        let z = z as usize;

        if !lights.contains(&[x, y, z]) {
            return;
        }

        lights[&[x, y, z]] = Lights::insert_sunlight(lights[&[x, y, z]], level);
    }

    /// Getter for red light by arbitrary coordinates
    fn get_red_light(lights: &Ndarray<u32>, x: i32, y: i32, z: i32) -> u32 {
        let x = x as usize;
        let y = y as usize;
        let z = z as usize;

        if !lights.contains(&[x, y, z]) {
            return 0;
        }

        Lights::extract_red_light(lights[&[x, y, z]])
    }

    /// Setter for red light by arbitrary coordinates
    fn set_red_light(lights: &mut Ndarray<u32>, x: i32, y: i32, z: i32, level: u32) {
        let x = x as usize;
        let y = y as usize;
        let z = z as usize;

        if !lights.contains(&[x, y, z]) {
            return;
        }

        lights[&[x, y, z]] = Lights::insert_red_light(lights[&[x, y, z]], level);
    }

    /// Getter for green light by arbitrary coordinates
    fn get_green_light(lights: &Ndarray<u32>, x: i32, y: i32, z: i32) -> u32 {
        let x = x as usize;
        let y = y as usize;
        let z = z as usize;

        if !lights.contains(&[x, y, z]) {
            return 0;
        }

        Lights::extract_green_light(lights[&[x, y, z]])
    }

    /// Setter for green light by arbitrary coordinates
    fn set_green_light(lights: &mut Ndarray<u32>, x: i32, y: i32, z: i32, level: u32) {
        let x = x as usize;
        let y = y as usize;
        let z = z as usize;

        if !lights.contains(&[x, y, z]) {
            return;
        }

        lights[&[x, y, z]] = Lights::insert_green_light(lights[&[x, y, z]], level);
    }

    /// Getter for blue light by arbitrary coordinates
    fn get_blue_light(lights: &Ndarray<u32>, x: i32, y: i32, z: i32) -> u32 {
        let x = x as usize;
        let y = y as usize;
        let z = z as usize;

        if !lights.contains(&[x, y, z]) {
            return 0;
        }

        Lights::extract_blue_light(lights[&[x, y, z]])
    }

    /// Setter for blue light by arbitrary coordinates
    fn set_blue_light(lights: &mut Ndarray<u32>, x: i32, y: i32, z: i32, level: u32) {
        let x = x as usize;
        let y = y as usize;
        let z = z as usize;

        if !lights.contains(&[x, y, z]) {
            return;
        }

        lights[&[x, y, z]] = Lights::insert_blue_light(lights[&[x, y, z]], level);
    }

    /// Getter for torch light with arbitrary coordinates by color
    #[inline]
    fn get_torch_light(
        lights: &Ndarray<u32>,
        vx: i32,
        vy: i32,
        vz: i32,
        color: &LightColor,
    ) -> u32 {
        match color {
            LightColor::Red => Lights::get_red_light(lights, vx, vy, vz),
            LightColor::Green => Lights::get_green_light(lights, vx, vy, vz),
            LightColor::Blue => Lights::get_blue_light(lights, vx, vy, vz),
            LightColor::None => panic!("Getting light of None"),
        }
    }

    /// Setter for torch light with arbitrary coordinates by color
    #[inline]
    fn set_torch_light(
        lights: &mut Ndarray<u32>,
        vx: i32,
        vy: i32,
        vz: i32,
        level: u32,
        color: &LightColor,
    ) {
        match color {
            LightColor::Red => Lights::set_red_light(lights, vx, vy, vz, level),
            LightColor::Green => Lights::set_green_light(lights, vx, vy, vz, level),
            LightColor::Blue => Lights::set_blue_light(lights, vx, vy, vz, level),
            LightColor::None => panic!("Setting light of None"),
        }
    }

    /// Remove a light source. Steps:
    ///
    /// 1. Remove the existing lights in a flood-fill fashion
    /// 2. If external light source exists, flood fill them back
    pub fn global_remove_light(
        chunks: &mut Chunks,
        vx: i32,
        vy: i32,
        vz: i32,
        is_sunlight: bool,
        color: &LightColor,
    ) {
        let max_height = chunks.config.max_height as i32;
        let max_light_level = chunks.config.max_light_level;

        let mut fill = VecDeque::<LightNode>::new();
        let mut queue = VecDeque::<LightNode>::new();

        queue.push_back(LightNode {
            voxel: Vec3(vx, vy, vz),
            level: if is_sunlight {
                chunks.get_sunlight(vx, vy, vz)
            } else {
                chunks.get_torch_light(vx, vy, vz, color)
            },
        });

        if is_sunlight {
            chunks.set_sunlight(vx, vy, vz, 0);
        } else {
            chunks.set_torch_light(vx, vy, vz, 0, color);
        }

        chunks.mark_saving_from_voxel(vx, vy, vz);

        while !queue.is_empty() {
            let LightNode { voxel, level } = queue.pop_front().unwrap();
            let Vec3(vx, vy, vz) = voxel;

            for [ox, oy, oz] in VOXEL_NEIGHBORS.iter() {
                let nvy = vy + oy;

                if nvy < 0 || nvy >= max_height {
                    continue;
                }

                let nvx = vx + ox;
                let nvz = vz + oz;
                let n_voxel = Vec3(nvx, nvy, nvz);

                let nl = if is_sunlight {
                    chunks.get_sunlight(nvx, nvy, nvz)
                } else {
                    chunks.get_torch_light(nvx, nvy, nvz, color)
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
                        chunks.set_torch_light(nvx, nvy, nvz, 0, color);
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

        Lights::global_flood_light(chunks, fill, is_sunlight, color);
    }

    /// Flood fill light from a queue
    pub fn global_flood_light(
        chunks: &mut Chunks,
        mut queue: VecDeque<LightNode>,
        is_sunlight: bool,
        color: &LightColor,
    ) {
        let max_height = chunks.config.max_height as i32;
        let max_light_level = chunks.config.max_light_level;

        while !queue.is_empty() {
            let LightNode { voxel, level } = queue.pop_front().unwrap();
            let Vec3(vx, vy, vz) = voxel;

            for [ox, oy, oz] in VOXEL_NEIGHBORS.iter() {
                let nvy = vy + oy;

                if nvy < 0 || nvy >= max_height {
                    continue;
                }

                let nvx = vx + ox;
                let nvz = vz + oz;
                let sd = is_sunlight && *oy == -1 && level == max_light_level;
                let nl = level - if sd { 0 } else { 1 };
                let n_voxel = Vec3(nvx, nvy, nvz);
                let block_type = chunks.get_block_by_voxel(nvx, nvy, nvz);

                if !block_type.is_transparent
                    || (if is_sunlight {
                        chunks.get_sunlight(nvx, nvy, nvz)
                    } else {
                        chunks.get_torch_light(nvx, nvy, nvz, color)
                    } >= nl)
                {
                    continue;
                }

                if is_sunlight {
                    chunks.set_sunlight(nvx, nvy, nvz, nl);
                } else {
                    chunks.set_torch_light(nvx, nvy, nvz, nl, color);
                }

                chunks.mark_saving_from_voxel(nvx, nvy, nvz);

                queue.push_back(LightNode {
                    voxel: n_voxel,
                    level: nl,
                })
            }
        }
    }

    /// Flood-fill a light source within a confined space
    pub fn flood_light(
        mut queue: VecDeque<LightNode>,
        is_sunlight: bool,
        color: &LightColor,
        space: &Space,
        lights: &mut Ndarray<u32>,
        registry: &Registry,
        config: &WorldConfig,
    ) {
        let max_height = config.max_height as i32;
        let max_light_level = config.max_light_level;

        // i heard .get() is faster than []
        let shape0 = *space.shape.get(0).unwrap() as i32;
        let shape2 = *space.shape.get(2).unwrap() as i32;

        let Vec3(start_x, _, start_z) = space.min;

        while !queue.is_empty() {
            let LightNode { voxel, level } = queue.pop_front().unwrap();
            let Vec3(vx, vy, vz) = voxel;

            for [ox, oy, oz] in VOXEL_NEIGHBORS.iter() {
                let nvy = vy + oy;

                if nvy < 0 || nvy >= max_height {
                    continue;
                }

                let nvx = vx + ox;
                let nvz = vz + oz;

                if nvx < 0 || nvz < 0 || nvx >= shape0 || nvz >= shape2 {
                    continue;
                }

                let sd = is_sunlight && *oy == -1 && level == max_light_level;
                let nl = level - if sd { 0 } else { 1 };
                let n_voxel = Vec3(nvx, nvy, nvz);
                let block_type =
                    registry.get_block_by_id(space.get_voxel(nvx + start_x, nvy, nvz + start_z));

                if !block_type.is_transparent
                    || (if is_sunlight {
                        Lights::get_sunlight(&lights, nvx, nvy, nvz)
                    } else {
                        Lights::get_torch_light(&lights, nvx, nvy, nvz, color)
                    } >= nl)
                {
                    continue;
                }

                if is_sunlight {
                    Lights::set_sunlight(lights, nvx, nvy, nvz, nl);
                } else {
                    Lights::set_torch_light(lights, nvx, nvy, nvz, nl, color);
                }

                queue.push_back(LightNode {
                    voxel: n_voxel,
                    level: nl,
                })
            }
        }
    }

    /// Propagate both sunlight and torch light within a confined space.
    pub fn propagate(space: &Space, registry: &Registry, config: &WorldConfig) -> Ndarray<u32> {
        let Space {
            width, min, shape, ..
        } = space;

        let &WorldConfig {
            chunk_size,
            max_height,
            max_light_level,
            ..
        } = config;

        let mut lights = ndarray(shape.to_owned(), 0);

        let mut red_light_queue = VecDeque::<LightNode>::new();
        let mut green_light_queue = VecDeque::<LightNode>::new();
        let mut blue_light_queue = VecDeque::<LightNode>::new();
        let mut sunlight_queue = VecDeque::<LightNode>::new();

        const RED: LightColor = LightColor::Red;
        const GREEN: LightColor = LightColor::Green;
        const BLUE: LightColor = LightColor::Blue;
        const NONE: LightColor = LightColor::None;

        let &Vec3(start_x, _, start_z) = min;

        for z in 1..(width - 1) as i32 {
            for x in 1..(width - 1) as i32 {
                let h = space.get_max_height(x + start_x, z + start_z) as i32;

                for y in (0..max_height as i32).rev() {
                    let id = space.get_voxel(x + start_x, y, z + start_z);
                    let &Block {
                        is_transparent,
                        is_light,
                        red_light_level,
                        green_light_level,
                        blue_light_level,
                        ..
                    } = registry.get_block_by_id(id);

                    if y > h && is_transparent {
                        Lights::set_sunlight(&mut lights, x, y, z, max_light_level);

                        for [ox, oz] in CHUNK_HORIZONTAL_NEIGHBORS.iter() {
                            let neighbor_id =
                                space.get_voxel(x + ox + start_x, y, z + oz + start_z);
                            let neighbor_block = registry.get_block_by_id(neighbor_id);

                            if !neighbor_block.is_transparent {
                                continue;
                            }

                            if space.get_max_height(x + ox + start_x, z + oz + start_z) > y as u32 {
                                // means sunlight should propagate here horizontally
                                if !sunlight_queue.iter().any(|LightNode { voxel, .. }| {
                                    voxel.0 == x && voxel.1 == y && voxel.2 == z
                                }) {
                                    sunlight_queue.push_back(LightNode {
                                        level: max_light_level,
                                        voxel: Vec3(x, y, z),
                                    })
                                }
                            }
                        }
                    }

                    if is_light {
                        if red_light_level > 0 {
                            Lights::set_red_light(&mut lights, x, y, z, red_light_level);

                            red_light_queue.push_back(LightNode {
                                level: red_light_level,
                                voxel: Vec3(x, y, z),
                            });
                        }

                        if green_light_level > 0 {
                            Lights::set_green_light(&mut lights, x, y, z, green_light_level);

                            green_light_queue.push_back(LightNode {
                                level: green_light_level,
                                voxel: Vec3(x, y, z),
                            });
                        }

                        if blue_light_level > 0 {
                            Lights::set_blue_light(&mut lights, x, y, z, blue_light_level);

                            blue_light_queue.push_back(LightNode {
                                level: blue_light_level,
                                voxel: Vec3(x, y, z),
                            });
                        }
                    }
                }
            }
        }

        Lights::flood_light(
            red_light_queue,
            false,
            &RED,
            space,
            &mut lights,
            registry,
            config,
        );
        Lights::flood_light(
            green_light_queue,
            false,
            &GREEN,
            space,
            &mut lights,
            registry,
            config,
        );
        Lights::flood_light(
            blue_light_queue,
            false,
            &BLUE,
            space,
            &mut lights,
            registry,
            config,
        );
        Lights::flood_light(
            sunlight_queue,
            true,
            &NONE,
            space,
            &mut lights,
            registry,
            config,
        );

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

    /// Calculate the light levels within a confined space
    pub fn calc_light(space: &Space, registry: &Registry, config: &WorldConfig) -> Ndarray<u32> {
        Lights::propagate(&space, registry, config)
    }
}
