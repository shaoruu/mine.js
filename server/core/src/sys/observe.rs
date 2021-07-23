use specs::{Entity, ReadExpect, ReadStorage, System, WriteStorage};

use server_utils::raycast;

use server_common::{math::approx_equals, vec::Vec3};

use crate::{
    comp::{
        rigidbody::RigidBody,
        target::{Target, TargetInner},
        view_radius::ViewRadius,
    },
    engine::{chunks::Chunks, kdtree::KdTree},
};

pub struct ObserveSystem;

impl<'a> System<'a> for ObserveSystem {
    #[allow(clippy::type_complexity)]
    type SystemData = (
        ReadExpect<'a, KdTree>,
        ReadExpect<'a, Chunks>,
        ReadStorage<'a, RigidBody>,
        ReadStorage<'a, ViewRadius>,
        WriteStorage<'a, Target>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (tree, chunks, bodies, radiuses, mut targets) = data;

        let dimension = chunks.config.dimension;
        let test_solid =
            |x: i32, y: i32, z: i32| -> bool { !chunks.get_walkable_by_voxel(x, y, z) };

        for (body, radius, target) in (&bodies, &radiuses, &mut targets).join() {
            let mut position = body.get_head_position();

            // loop until found or nothing found
            let mut closest: Option<(Vec3<f32>, bool, Entity)>;

            let closest_arr = (match target.0 {
                TargetInner::ALL(_) => tree.search(&position, 1),
                TargetInner::ENTITY(_) => tree.search_entity(&position, 1, true),
                TargetInner::PLAYER(_) => tree.search_player(&position, 1, false),
            })
            .into_iter()
            .map(|(_, entity)| {
                (
                    bodies.get(entity.to_owned()).unwrap().get_head_position(),
                    false,
                    entity.to_owned(),
                )
            })
            .collect::<Vec<_>>();

            if closest_arr.is_empty() {
                closest = None;
            } else {
                closest = Some(closest_arr[0].clone());
            }

            // check if there are any blocks in between
            if let Some((c, _, ent)) = &closest {
                let mut dir = c.clone().sub(&position);
                let dist = dir.len();

                // closest point is too far, target nothing
                if dist > radius.0 as f32 * dimension as f32 {
                    closest = None;
                } else if !approx_equals(&dist, &0.0) {
                    // there's something blocking the target from seeing
                    let hit = raycast::trace(
                        dist,
                        &test_solid,
                        &mut position,
                        &mut dir,
                        &mut Vec3::default(),
                        &mut Vec3::default(),
                    );

                    if hit {
                        closest = Some((c.to_owned(), true, ent.to_owned()));
                    }
                }
            }

            target.set(closest);
        }
    }
}
