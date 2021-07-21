use specs::{ReadExpect, ReadStorage, System, WriteStorage};

use server_utils::raycast;

use server_common::{math::approx_equals, vec::Vec3};

use crate::{
    comp::{
        lookat::{LookAt, LookTarget},
        rigidbody::RigidBody,
    },
    engine::{chunks::Chunks, kdtree::KdTree},
};

pub struct ObserveSystem;

impl<'a> System<'a> for ObserveSystem {
    type SystemData = (
        ReadExpect<'a, KdTree>,
        ReadExpect<'a, Chunks>,
        ReadStorage<'a, RigidBody>,
        WriteStorage<'a, LookAt>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (tree, chunks, bodies, mut look_ats) = data;

        let test_solid = |x: i32, y: i32, z: i32| -> bool { chunks.get_solidity_by_voxel(x, y, z) };

        for (body, look_at) in (&bodies, &mut look_ats).join() {
            let mut position = body.get_position();

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

            let mut closest = if closest_arr.is_empty() {
                None
            } else if closest_arr.len() == 1 {
                Some(closest_arr[0].clone())
            } else {
                Some(closest_arr[1].clone())
            };

            // check if there are any blocks in between
            if let Some(c) = &closest {
                let mut dir = c.clone().sub(&position);
                let dist = dir.len();

                if !approx_equals(&dist, &0.0) {
                    let hit = raycast::trace(
                        dist,
                        &test_solid,
                        &mut position,
                        &mut dir,
                        &mut Vec3::default(),
                        &mut Vec3::default(),
                    );

                    if hit {
                        closest = None;
                    }
                }
            }

            look_at.0 = LookTarget::insert(&look_at.0, closest);
        }
    }
}
