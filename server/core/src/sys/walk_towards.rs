use server_common::vec::Vec3;
use server_utils::convert::map_world_to_voxel;
use specs::{ReadExpect, ReadStorage, System, WriteStorage};

use crate::{
    comp::{brain::Brain, rigidbody::RigidBody, walk_towards::WalkTowards},
    engine::{clock::Clock, world::WorldConfig},
};

pub struct WalkTowardsSystem;

impl<'a> System<'a> for WalkTowardsSystem {
    #[allow(clippy::type_complexity)]
    type SystemData = (
        ReadExpect<'a, Clock>,
        ReadExpect<'a, WorldConfig>,
        ReadStorage<'a, WalkTowards>,
        WriteStorage<'a, RigidBody>,
        WriteStorage<'a, Brain>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use rayon::prelude::*;
        use specs::ParJoin;

        let (clock, config, walk_towards, mut bodies, mut brains) = data;

        let dimension = config.dimension;
        let delta = clock.delta;

        (&walk_towards, &mut bodies, &mut brains)
            .par_join()
            .for_each(|(walk_towards, body, brain)| {
                if let Some(nodes) = &walk_towards.0 {
                    let position = body.get_position();
                    let voxel = map_world_to_voxel(position.0, position.1, position.2, dimension);

                    let mut target = nodes[0].clone();

                    // means currently is in the attended node
                    if nodes[0] == voxel {
                        if nodes.len() > 1 {
                            target = nodes[1].clone();
                        } else {
                            // arrived at target, don't move.
                            brain.stop();
                            return;
                        }
                    }

                    // jumping
                    if nodes.len() > 1 && nodes[0].1 < nodes[1].1 {
                        brain.jump();
                        target = nodes[1].clone();
                    } else {
                        brain.stop_jumping();
                    }

                    // diagonal
                    if nodes.len() > 1 && nodes[0].0 != nodes[1].0 && nodes[0].1 != nodes[1].1 {
                        target = nodes[1].clone();
                    }

                    let offset = 0.5 * dimension as f32;
                    let target = Vec3(
                        target.0 as f32 + offset,
                        target.1 as f32,
                        target.2 as f32 + offset,
                    );

                    brain.walk();
                    brain.operate(&target, body, delta);
                } else {
                    brain.stop();
                }
            });
    }
}
