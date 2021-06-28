use crate::libs::{
    ndarray::{ndarray, Ndarray},
    types::Coords2,
};

use super::{chunks::Chunks, world::WorldMetrics};

/// A data access model that samples a 3D space of voxels in the world.
/// Used for reference in other threads.
pub struct Space {
    pub width: usize,
    pub voxels: Ndarray<u32>,
    pub height_map: Ndarray<usize>,
}

impl Space {
    pub fn new(chunks: &Chunks, center: &Coords2<i32>, margin: usize) -> Self {
        let WorldMetrics {
            chunk_size,
            max_height,
            ..
        } = chunks.metrics;

        assert!(margin > 0, "Margin of 0 on Space is wasteful");

        let width = chunk_size + margin * 2;
        let mut voxels = ndarray(vec![width, max_height as usize, width], 0);
        let mut height_map = ndarray(vec![width, width], 0);

        let center_chunk = chunks.get_chunk(&center).unwrap();
        let min = center_chunk.min.clone();

        for dx in 0..width {
            for dz in 0..width {
                let mut h = 0;
                for dy in 0..max_height as usize {
                    let voxel = chunks.get_voxel_by_voxel(
                        (min.0 as usize - margin + dx) as i32,
                        dy as i32,
                        (min.2 as usize - margin + dz) as i32,
                    );

                    if dy > h
                        && (dy == 0
                            || (!chunks.registry.is_air(voxel) && !chunks.registry.is_plant(voxel)))
                    {
                        h = dy;
                    }

                    voxels[&[dx, dy, dz]] = voxel;
                }
                height_map[&[dx, dz]] = h;
            }
        }

        Self {
            width,
            voxels,
            height_map,
        }
    }
}
