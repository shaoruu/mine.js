use specs::{ReadExpect, ReadStorage, System, WriteStorage};

use crate::{
    comp::{
        lookat::{LookAt, LookTarget},
        rigidbody::RigidBody,
    },
    engine::kdtree::KdTree,
};

pub struct ObserveSystem;

impl<'a> System<'a> for ObserveSystem {
    type SystemData = (
        ReadExpect<'a, KdTree>,
        ReadStorage<'a, RigidBody>,
        WriteStorage<'a, LookAt>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (tree, bodies, mut look_ats) = data;

        for (body, look_at) in (&bodies, &mut look_ats).join() {
            let position = body.get_position();

            let closest_arr = (match look_at.0 {
                LookTarget::ALL(_) => tree.search(&position, 2),
                LookTarget::ENTITY(_) => tree.search_entity(&position, 2),
                LookTarget::PLAYER(_) => tree.search_player(&position, 1),
            })
            .into_iter()
            .map(|(_, entity)| bodies.get(entity.to_owned()).unwrap().get_position())
            .collect::<Vec<_>>();

            if closest_arr.is_empty() {
                continue;
            }

            let closest = if closest_arr.is_empty() {
                None
            } else if closest_arr.len() == 1 {
                Some(closest_arr[0].clone())
            } else {
                Some(closest_arr[1].clone())
            };

            look_at.0 = match look_at.0 {
                LookTarget::ALL(_) => LookTarget::ALL(closest),
                LookTarget::ENTITY(_) => LookTarget::ENTITY(closest),
                LookTarget::PLAYER(_) => LookTarget::PLAYER(closest),
            };
        }
    }
}
