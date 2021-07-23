use specs::{ReadExpect, System, WriteStorage};

use crate::{comp::rigidbody::RigidBody, engine::physics::Physics};

use super::super::engine::{chunks::Chunks, clock::Clock};

pub struct PhysicsSystem;

impl<'a> System<'a> for PhysicsSystem {
    type SystemData = (
        ReadExpect<'a, Physics>,
        ReadExpect<'a, Clock>,
        ReadExpect<'a, Chunks>,
        WriteStorage<'a, RigidBody>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use rayon::prelude::*;
        use specs::ParJoin;

        let (core, clock, chunks, mut bodies) = data;

        let test_solid =
            |x: i32, y: i32, z: i32| -> bool { !chunks.get_walkable_by_voxel(x, y, z) };
        let test_fluid = |_, _, _| false;

        (&mut bodies)
            .par_join()
            .for_each(|b| core.iterate_body(b, clock.delta_secs(), &test_solid, &test_fluid));
    }
}
