use std::f32::consts::PI;

use super::super::engine::{chunk::Chunk, registry::Registry};

use super::biomes::{get_biome_config, BiomeConfig};

use server_common::{noise::Noise, vec::Vec3};

/// Decoration update unit
#[derive(Clone, Debug)]
pub struct VoxelUpdate {
    pub voxel: Vec3<i32>,
    pub id: u32,
}

/// Tool to decorate chunks
#[derive(Debug)]
pub struct Builder {
    noise: Noise,
    registry: Registry,
}

impl Builder {
    pub fn new(registry: Registry, noise: Noise) -> Self {
        Self { noise, registry }
    }

    /// Helper function to draw a circle of blocks horizontally
    fn draw_circle(x: i32, y: i32, z: i32, r: i32, id: u32) -> Vec<VoxelUpdate> {
        let mut sx = 0;
        let mut sz = 0;

        let r = r as f32;

        let mut updates = Vec::new();

        for step in 0..360 {
            let new_x = ((step as f32 / 360.0 * 2.0 * PI).sin() * r) as i32;
            let new_z = ((step as f32 / 360.0 * 2.0 * PI).cos() * r) as i32;

            if sx != new_x || sz != new_z {
                updates.push(VoxelUpdate {
                    id,
                    voxel: Vec3(x + new_x, y, z + new_z),
                });

                sx = new_x;
                sz = new_z;
            }
        }

        updates
    }

    /// Sample locations within chunk to place plants down
    fn sample_plants(&self, chunk: &Chunk) -> Vec<Vec3<i32>> {
        let mut locations = Vec::new();
        let Chunk { min, max, .. } = chunk;

        for vx in min.0..max.0 {
            for vz in min.2..max.2 {
                let vy = chunk.get_max_height(vx, vz) as i32;

                let BiomeConfig { plant_scale, .. } = get_biome_config(vx, vz, &self.noise).1;

                if self.registry.is_plantable(chunk.get_voxel(vx, vy, vz))
                    && self
                        .noise
                        .central_fractal_perlin(vx as f64, vz as f64, plant_scale, 5)
                {
                    locations.push(Vec3(vx, vy + 1, vz));
                }
            }
        }

        locations
    }

    /// Place plants down on sampled locations
    fn generate_plants(&self, chunk: &Chunk) -> Vec<VoxelUpdate> {
        let locations = self.sample_plants(chunk);
        let types =
            self.registry
                .get_type_map(vec!["Dirt", "Grass", "Brown Mushroom", "Red Mushroom"]);

        let mut updates = Vec::new();

        for location in locations.into_iter() {
            let Vec3(vx, vy, vz) = location;
            let stand = chunk.get_voxel(vx, vy - 1, vz);

            let mut id = types["Grass"];

            let BiomeConfig { plant_scale, .. } = get_biome_config(vx, vz, &self.noise).1;

            let vx = vx as f64;
            let vy = vy as f64;
            let vz = vz as f64;

            if self
                .noise
                .fractal_octave_perlin3(vx, vy, vz, plant_scale * 2.46, 3)
                > 0.3
            {
                id = types["Red Mushroom"];
            } else if self
                .noise
                .fractal_octave_perlin3(vx, vy, vz, plant_scale * 10.852, 6)
                > 0.33
                && stand == types["Dirt"]
            {
                id = types["Brown Mushroom"];
            }

            updates.push(VoxelUpdate {
                id,
                voxel: location,
            });
        }

        updates
    }

    /// Sample locations within chunk to place trees down
    fn sample_trees(&self, chunk: &Chunk) -> Vec<Vec3<i32>> {
        let mut locations = Vec::new();
        let Chunk { min, max, .. } = chunk;

        for vx in min.0..max.0 {
            for vz in min.2..max.2 {
                let vy = chunk.get_max_height(vx, vz) as i32;
                let BiomeConfig { tree_scale, .. } = get_biome_config(vx, vz, &self.noise).1;

                if self.registry.is_plantable(chunk.get_voxel(vx, vy, vz))
                    && self.noise.central_perlin(vx as f64, vz as f64, tree_scale)
                {
                    locations.push(Vec3(vx, vy, vz));
                }
            }
        }

        locations
    }

    /// Place trees down on sampled locations
    fn generate_trees(&self, chunk: &Chunk) -> Vec<VoxelUpdate> {
        let locations = self.sample_trees(chunk);
        let types = self
            .registry
            .get_type_map(vec!["Oak Log", "Oak Leaves", "Acacia Leaves"]);

        let mut updates = Vec::new();

        for location in locations.into_iter() {
            let Vec3(vx, vy, vz) = location;

            let BiomeConfig { tree_scale, .. } = get_biome_config(vx, vz, &self.noise).1;

            let test2 = tree_scale * 1.424;
            let test3 = tree_scale * 2.41;
            let test4 = tree_scale * 5.3425;

            let vx = vx as f64;
            let vy = vy as f64;
            let vz = vz as f64;

            let height = if self.noise.perlin2(vx, vz, test4) > 0.06 {
                3
            } else {
                2
            };

            let bush_height = if self.noise.perlin2(vx, vz, 0.005) > 0.1 {
                8
            } else if self.noise.perlin2(vx, vz, test2) > 0.1 {
                5
            } else if height == 3 {
                3
            } else {
                2
            };

            let leaves_type = if self.noise.perlin2(vx, vz, 0.005) > 0.1 {
                types["Acacia Leaves"]
            } else {
                types["Oak Leaves"]
            };

            for i in 0..height {
                updates.push(VoxelUpdate {
                    voxel: Vec3(vx as i32, vy as i32 + i, vz as i32),
                    id: types["Oak Log"],
                })
            }

            let Vec3(tbx, tby, tbz) = Vec3(vx as i32, vy as i32 + height, vz as i32);

            let bush_size = 1;
            let bush_big_size = 2;

            for j in 0..=bush_height {
                let limit: i32 = if j % 3 == 1
                    || j % 3 == (if height == 2 { 0 } else { 2 }) && j != bush_height
                {
                    bush_big_size
                } else {
                    bush_size
                };

                for i in -limit..=limit {
                    for k in -limit..=limit {
                        let center = i == 0 && k == 0;
                        let mf = if center && j != bush_height {
                            types["Oak Log"]
                        } else {
                            leaves_type
                        };

                        if i.abs() == limit && k.abs() == limit {
                            continue;
                        }

                        if !center
                            && self.noise.fractal_octave_perlin3(
                                (vx as i32 + i) as f64,
                                (vy as i32 + j) as f64,
                                (vz as i32 + k) as f64,
                                test3,
                                9,
                            ) > 0.4
                        {
                            continue;
                        }

                        updates.push(VoxelUpdate {
                            voxel: Vec3(tbx + i, tby + j, tbz + k),
                            id: mf,
                        });
                    }
                }
            }
        }

        updates
    }

    /// Sample locations within chunk to place lamps down
    fn sample_lamps(&self, chunk: &Chunk) -> Vec<Vec3<i32>> {
        let mut locations = Vec::new();
        let Chunk { min, max, .. } = chunk;

        for vx in min.0..max.0 {
            for vz in min.2..max.2 {
                let vy = chunk.get_max_height(vx, vz) as i32;
                if self.noise.central_perlin(vx as f64, vz as f64, 0.02) {
                    locations.push(Vec3(vx, vy, vz));
                }
            }
        }

        locations
    }

    /// Place lamps down on sampled locations
    fn generate_lamps(&self, chunk: &Chunk) -> Vec<VoxelUpdate> {
        let locations = self.sample_lamps(chunk);
        let types = self.registry.get_type_map(vec!["Stone", "Color Yellow"]);

        let mut updates = Vec::new();

        for location in locations.into_iter() {
            updates.push(VoxelUpdate {
                voxel: location,
                id: types["Color Yellow"],
            })
        }

        updates
    }

    /// Sample locations within chunk to place a big stone structure down
    fn sample_stone_structure(&self, chunk: &Chunk) -> Vec<Vec3<i32>> {
        let mut locations = Vec::new();
        let Chunk { min, max, .. } = chunk;

        for vx in min.0..max.0 {
            for vz in min.2..max.2 {
                let vy = chunk.get_max_height(vx, vz) as i32;
                if self.noise.central_perlin(vx as f64, vz as f64, 0.008) {
                    locations.push(Vec3(vx, vy + 1, vz));
                }
            }
        }

        locations
    }

    /// Place big stone structures down on sampled locations
    fn generate_stone_structure(&self, chunk: &Chunk) -> Vec<VoxelUpdate> {
        let locations = self.sample_stone_structure(chunk);
        let types = self
            .registry
            .get_type_map(vec!["Color Yellow", "Stone Bricks"]);

        let mut updates = Vec::new();

        for location in locations.into_iter() {
            let Vec3(vx, vy, vz) = location;

            for i in 0..6 {
                updates.append(&mut Builder::draw_circle(
                    vx,
                    vy + i,
                    vz,
                    3 + i % 3 - 1,
                    types["Stone Bricks"],
                ));
            }

            for i in 0..4 {
                updates.push(VoxelUpdate {
                    voxel: Vec3(vx, vy + i, vz),
                    id: types["Color Yellow"],
                });
            }
        }

        updates
    }

    /// Returns a list of voxel updates from chunk
    pub fn build(&self, chunk: &Chunk) -> Vec<VoxelUpdate> {
        let mut updates = Vec::new();

        updates.append(&mut self.generate_lamps(chunk));
        updates.append(&mut self.generate_stone_structure(chunk));
        updates.append(&mut self.generate_plants(chunk));
        updates.append(&mut self.generate_trees(chunk));

        updates
    }
}
