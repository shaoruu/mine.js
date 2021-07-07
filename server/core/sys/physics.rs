use specs::{ReadExpect, System, WriteExpect, WriteStorage};

use crate::{
    core::{
        comp::phys::Phys,
        engine::{chunks::Chunks, clock::Clock},
    },
    libs::physics::Physics,
};

pub struct PhysicsSystem;

impl<'a> System<'a> for PhysicsSystem {
    type SystemData = (
        WriteExpect<'a, Physics>,
        ReadExpect<'a, Clock>,
        ReadExpect<'a, Chunks>,
        WriteStorage<'a, Phys>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (mut core, clock, chunks, mut phys) = data;

        for p in &mut (&mut phys).join() {
            core.iterate_body(&mut p.body, clock.delta, &chunks)
        }
    }
}
