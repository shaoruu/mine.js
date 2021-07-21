use specs::{ReadExpect, ReadStorage, System, WriteStorage};

use crate::{
    comp::{brain::Brain, lookat::LookAt, rigidbody::RigidBody},
    engine::clock::Clock,
};

pub struct JumpingSystem;

impl<'a> System<'a> for JumpingSystem {
    type SystemData = (
        ReadExpect<'a, Clock>,
        ReadStorage<'a, LookAt>,
        WriteStorage<'a, RigidBody>,
        WriteStorage<'a, Brain>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (clock, look_ats, mut bodies, mut brains) = data;
        let tick = clock.tick;

        if tick % 100 == 0 {
            let delta = clock.delta;

            for (look_at, body, brain) in (&look_ats, &mut bodies, &mut brains).join() {
                brain.jump();
                brain.operate(look_at, body, delta);
            }
        }
    }
}
