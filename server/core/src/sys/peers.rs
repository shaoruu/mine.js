use log::info;

use ansi_term::Colour::Yellow;

use specs::{ReadExpect, ReadStorage, System, WriteExpect, WriteStorage};

use server_common::{quaternion::Quaternion, vec::Vec3};

use crate::{
    comp::{id::Id, name::Name, rigidbody::RigidBody, rotation::Rotation},
    engine::{
        players::{PlayerUpdates, Players},
        world::MessagesQueue,
    },
    network::models::{create_chat_message, messages, ChatType, MessageType},
};

pub struct PeersSystem;

impl<'a> System<'a> for PeersSystem {
    #[allow(clippy::type_complexity)]
    type SystemData = (
        ReadExpect<'a, String>,
        WriteExpect<'a, PlayerUpdates>,
        WriteExpect<'a, MessagesQueue>,
        WriteExpect<'a, Players>,
        ReadStorage<'a, Id>,
        WriteStorage<'a, Name>,
        WriteStorage<'a, RigidBody>,
        WriteStorage<'a, Rotation>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (
            world_name,
            mut updates,
            mut messages,
            mut players,
            ids,
            mut names,
            mut bodies,
            mut rotations,
        ) = data;

        for (id, name, body, rotation) in (&ids, &mut names, &mut bodies, &mut rotations).join() {
            if let Some(update) = updates.remove(&id.val) {
                let messages::Peer {
                    name: new_name,
                    px,
                    py,
                    pz,
                    qx,
                    qy,
                    qz,
                    qw,
                    ..
                } = update;

                if name.val.is_none() {
                    let message =
                        format!("{} joined the world {}", new_name, world_name.to_string());

                    info!("{}", Yellow.bold().paint(message));

                    let new_message = create_chat_message(
                        MessageType::Message,
                        ChatType::Info,
                        "",
                        format!("{} joined the game", new_name).as_str(),
                    );

                    messages.push((new_message, vec![]));
                }

                name.val = Some(new_name.clone());
                players.get_mut(&id.val).unwrap().name = Some(new_name);
                body.set_position(&Vec3(px, py, pz));
                rotation.val = Quaternion(qx, qy, qz, qw);
            }
        }
    }
}
