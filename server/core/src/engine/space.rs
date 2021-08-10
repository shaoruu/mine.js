use hashbrown::HashMap;

use super::{chunks::Chunks, world::WorldConfig};

use server_common::{
    ndarray::Ndarray,
    vec::{Vec2, Vec3},
};
use server_utils::convert::{map_voxel_to_chunk, map_voxel_to_chunk_local};

/// A data access model that samples a 3D space of voxels in the world.
/// Used for reference in other threads.
pub struct Space {
    pub width: usize,
    pub shape: Vec<usize>,
    pub min: Vec3<i32>,

    voxels: HashMap<Vec2<i32>, Ndarray<u32>>,
    height_maps: HashMap<Vec2<i32>, Ndarray<u32>>,
    chunk_size: usize,
}

impl Space {
    pub fn new(chunks: &Chunks, Vec2(cx, cz): &Vec2<i32>, margin: usize) -> Self {
        assert!(margin > 0, "Margin of 0 on Space is wasteful");

        let WorldConfig {
            chunk_size,
            max_height,
            ..
        } = *chunks.config;

        let width = chunk_size + margin * 2;

        let mut voxels = HashMap::new();
        let mut height_maps = HashMap::new();

        let chunk_size = chunks.config.chunk_size;
        let extended = (margin as f32 / chunk_size as f32).ceil() as i32;

        for x in -extended..(extended + 1) {
            for z in -extended..(extended + 1) {
                if let Some(chunk) = chunks.raw(&Vec2(cx + x, cz + z)) {
                    let voxel_data_clone = chunk.get_voxels().clone();
                    let height_map_clone = chunk.get_height_map().clone();
                    voxels.insert(chunk.coords.to_owned(), voxel_data_clone);
                    height_maps.insert(chunk.coords.to_owned(), height_map_clone);
                }
            }
        }

        let cs = chunk_size as i32;
        let m = margin as i32;
        // i'm not sure why it needs a +1 here, but it does.
        let min = Vec3(cx * cs - m + 1, 0, cz * cs - m + 1);

        let shape = vec![width, max_height as usize, width];

        Self {
            width,
            shape,
            min,
            voxels,
            height_maps,
            chunk_size,
        }
    }

    /// Access a voxel by voxel coordinates within the space
    ///
    /// `x,y,z` in terms of voxels
    pub fn get_voxel(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        let coords = map_voxel_to_chunk(vx, vy, vz, self.chunk_size);
        let Vec3(lx, ly, lz) = map_voxel_to_chunk_local(vx, vy, vz, self.chunk_size);
        if let Some(voxels) = self.voxels.get(&coords) {
            voxels[&[lx as usize, ly as usize, lz as usize]]
        } else {
            0
        }
    }

    /// Access the max height by voxel column within the space
    ///
    /// `x,y,z` in terms of voxels
    pub fn get_max_height(&self, vx: i32, vz: i32) -> u32 {
        let coords = map_voxel_to_chunk(vx, 0, vz, self.chunk_size);
        let Vec3(lx, _, lz) = map_voxel_to_chunk_local(vx, 0, vz, self.chunk_size);
        if let Some(height_map) = self.height_maps.get(&coords) {
            height_map[&[lx as usize, lz as usize]]
        } else {
            0
        }
    }
}
