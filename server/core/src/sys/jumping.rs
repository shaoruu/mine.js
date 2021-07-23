use specs::{ReadExpect, ReadStorage, System, WriteStorage};

use crate::{
    comp::{brain::Brain, rigidbody::RigidBody, target::Target},
    engine::clock::Clock,
};

pub struct JumpingSystem;

impl<'a> System<'a> for JumpingSystem {
    type SystemData = (
        ReadExpect<'a, Clock>,
        ReadStorage<'a, Target>,
        WriteStorage<'a, RigidBody>,
        WriteStorage<'a, Brain>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use rayon::prelude::*;
        use specs::ParJoin;

        let (clock, targets, mut bodies, mut brains) = data;
        let tick = clock.tick;

        if tick % 100 == 0 {
            let delta = clock.delta;

            (&targets, &mut bodies, &mut brains)
                .par_join()
                .for_each(|(target, body, brain)| {
                    brain.jump();
                    brain.operate(target, body, delta);
                });
        }
    }
}
