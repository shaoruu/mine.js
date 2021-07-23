use server_utils::convert::map_world_to_voxel;
use specs::{Entities, ReadExpect, ReadStorage, System, WriteExpect};

use server_common::vec::Vec3;

use crate::{
    comp::{
        curr_chunk::CurrChunk, etype::EType, rigidbody::RigidBody, target::Target,
        walk_towards::WalkTowards,
    },
    engine::world::{MessagesQueue, WorldConfig},
    network::models::{create_message, EntityProtocol, MessageComponents, MessageType},
};

pub struct EntitiesSystem;

impl<'a> System<'a> for EntitiesSystem {
    #[allow(clippy::type_complexity)]
    type SystemData = (
        Entities<'a>,
        ReadExpect<'a, WorldConfig>,
        WriteExpect<'a, MessagesQueue>,
        ReadStorage<'a, EType>,
        ReadStorage<'a, RigidBody>,
        ReadStorage<'a, CurrChunk>,
        ReadStorage<'a, Target>,
        ReadStorage<'a, WalkTowards>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (entities, configs, mut messages, types, bodies, curr_chunks, targets, walk_towards) =
            data;

        let dimension = configs.dimension;

        let mut entity_updates = vec![];

        for (ent, etype, body, _curr_chunk, target, walk_toward) in (
            &*entities,
            &types,
            &bodies,
            &curr_chunks,
            &targets,
            &walk_towards,
        )
            .join()
        {
            let Vec3(px, py, pz) = body.get_position();

            let look_target = target.get_position();
            let mut heading: Option<Vec3<f32>> = walk_toward.0.as_ref().map(|nodes| {
                let mut node = Vec3::<f32>::from(if nodes.len() > 1 {
                    &nodes[1]
                } else {
                    &nodes[0]
                });
                node.0 += 0.5;
                node.1 += body.head;
                node.2 += 0.5;
                node
            });

            if let Some(h) = &heading {
                let h_pos = map_world_to_voxel(h.0, h.1, h.2, dimension);
                let b_pos = map_world_to_voxel(px, py, pz, dimension);
                if h_pos == b_pos {
                    heading = None;
                }
            }

            entity_updates.push(EntityProtocol {
                id: ent.id().to_string(),
                r#type: etype.0.to_owned(),
                look_at: look_target,
                heading,
                px,
                py,
                pz,
            })
        }

        if !entity_updates.is_empty() {
            let mut components = MessageComponents::default_for(MessageType::Entity);
            components.entities = Some(entity_updates);

            let msg = create_message(components);
            messages.push((msg, None, None, None));
        }
    }
}
