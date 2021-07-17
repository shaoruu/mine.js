use specs::{ReadExpect, ReadStorage, System, WriteStorage};

use server_utils::convert::{map_voxel_to_chunk, map_world_to_voxel};

use server_common::vec::Vec3;

use crate::{
    comp::{curr_chunk::CurrChunk, rigidbody::RigidBody},
    engine::world::WorldConfig,
};

pub struct ChunkingSystem;

impl<'a> System<'a> for ChunkingSystem {
    type SystemData = (
        ReadExpect<'a, WorldConfig>,
        ReadStorage<'a, RigidBody>,
        WriteStorage<'a, CurrChunk>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (configs, bodies, mut curr_chunks) = data;
        let chunk_size = configs.chunk_size;
        let dimension = configs.dimension;

        for (body, curr_chunk) in (&bodies, &mut curr_chunks).join() {
            let Vec3(px, py, pz) = body.get_position();
            let Vec3(vx, vy, vz) = map_world_to_voxel(px, py, pz, dimension);
            let new_chunk = map_voxel_to_chunk(vx, vy, vz, chunk_size);

            if curr_chunk.diff(&new_chunk) {
                curr_chunk.val = Some(new_chunk.clone());
                curr_chunk.changed = true;
            }
        }
    }
}
