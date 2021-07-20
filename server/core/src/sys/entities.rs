use server_common::{quaternion::Quaternion, vec::Vec3};
use specs::{Entities, ReadStorage, System, WriteExpect};

use crate::{
    comp::{
        curr_chunk::CurrChunk,
        etype::EType,
        lookat::{LookAt, LookTarget},
        rigidbody::RigidBody,
        rotation::Rotation,
    },
    engine::world::MessagesQueue,
    network::models::{create_message, EntityProtocol, MessageComponents, MessageType},
};

pub struct EntitiesSystem;

impl<'a> System<'a> for EntitiesSystem {
    #[allow(clippy::type_complexity)]
    type SystemData = (
        Entities<'a>,
        WriteExpect<'a, MessagesQueue>,
        ReadStorage<'a, EType>,
        ReadStorage<'a, RigidBody>,
        ReadStorage<'a, Rotation>,
        ReadStorage<'a, CurrChunk>,
        ReadStorage<'a, LookAt>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (entities, mut messages, types, bodies, rotations, curr_chunks, look_ats) = data;

        let mut entity_updates = vec![];

        for (ent, etype, body, rotation, _curr_chunk, look_at) in (
            &*entities,
            &types,
            &bodies,
            &rotations,
            &curr_chunks,
            &look_ats,
        )
            .join()
        {
            let Vec3(px, py, pz) = body.get_position();
            let Quaternion(qx, qy, qz, qw) = rotation.0;

            let look_target = LookTarget::extract(look_at.0.clone());

            entity_updates.push(EntityProtocol {
                id: ent.id().to_string(),
                r#type: etype.0.to_owned(),
                look_at: look_target,
                px,
                py,
                pz,
                qx,
                qy,
                qz,
                qw,
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
