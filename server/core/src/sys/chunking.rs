use log::debug;
use server_common::vec::Vec3;
use server_utils::convert::{map_voxel_to_chunk, map_world_to_voxel};
use specs::{ReadExpect, ReadStorage, System, WriteExpect, WriteStorage};

use crate::{
    comp::{curr_chunk::CurrChunk, rigidbody::RigidBody, view_radius::ViewRadius},
    engine::{chunks::Chunks, world::WorldConfig},
};

pub struct ChunkingSystem;

impl<'a> System<'a> for ChunkingSystem {
    #[allow(clippy::type_complexity)]
    type SystemData = (
        ReadExpect<'a, WorldConfig>,
        WriteExpect<'a, Chunks>,
        ReadStorage<'a, RigidBody>,
        ReadStorage<'a, ViewRadius>,
        WriteStorage<'a, CurrChunk>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (configs, mut chunks, bodies, radiuses, mut curr_chunks) = data;
        let mut to_generate = vec![];

        for (body, radius, curr_chunk) in (&bodies, &radiuses, &mut curr_chunks).join() {
            let chunk_size = configs.chunk_size;
            let dimension = configs.dimension;

            let Vec3(px, py, pz) = body.get_position();
            let Vec3(vx, vy, vz) = map_world_to_voxel(px, py, pz, dimension);
            let new_chunk = map_voxel_to_chunk(vx, vy, vz, chunk_size);

            if curr_chunk.diff(&new_chunk) {
                curr_chunk.val = Some(new_chunk.clone());
                to_generate.push((new_chunk, radius.val));
            }
        }

        to_generate
            .iter()
            .for_each(|(coords, r)| chunks.generate(coords, *r, false));
    }
}
