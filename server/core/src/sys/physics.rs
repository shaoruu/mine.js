use specs::{ReadExpect, System, WriteStorage};

use super::super::{
    comp::phys::Phys,
    engine::{chunks::Chunks, clock::Clock},
};

use server_libs::physics::Physics;

pub struct PhysicsSystem;

impl<'a> System<'a> for PhysicsSystem {
    type SystemData = (
        ReadExpect<'a, Physics>,
        ReadExpect<'a, Clock>,
        ReadExpect<'a, Chunks>,
        WriteStorage<'a, Phys>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (core, clock, chunks, mut phys) = data;

        let test_solid = |x: i32, y: i32, z: i32| -> bool { chunks.get_solidity_by_voxel(x, y, z) };
        let test_fluid = |_, _, _| false;

        for p in (&mut phys).join() {
            core.iterate_body(&mut p.body, clock.delta_secs(), &test_solid, &test_fluid);
        }
    }
}
