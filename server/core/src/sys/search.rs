use specs::{Entities, ReadStorage, System, WriteExpect};

use crate::{
    comp::{id::Id, rigidbody::RigidBody},
    engine::kdtree::KdTree,
};

pub struct SearchSystem;

impl<'a> System<'a> for SearchSystem {
    type SystemData = (
        Entities<'a>,
        WriteExpect<'a, KdTree>,
        ReadStorage<'a, Id>,
        ReadStorage<'a, RigidBody>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (entities, mut tree, ids, bodies) = data;

        tree.reset();

        for (ent, body, _) in (&*entities, &bodies, &ids).join() {
            let pos = body.get_position();
            tree.add_player(ent, pos);
        }

        for (ent, body, ()) in (&*entities, &bodies, !&ids).join() {
            let pos = body.get_position();
            tree.add_entity(ent, pos);
        }
    }
}
