use std::collections::HashMap;

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
    network::models::{
        create_chat_message, create_message, messages, ChatType, MessageComponents, MessageType,
        PeerProtocol,
    },
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

        let mut peers_update = HashMap::new();

        for (id, name, body, rotation) in (&ids, &mut names, &mut bodies, &mut rotations).join() {
            if let Some(update) = updates.remove(&id.0) {
                let messages::Peer {
                    id: peer_id,
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

                peers_update.insert(
                    id.0,
                    PeerProtocol {
                        id: peer_id,
                        name: new_name.clone(),
                        px,
                        py,
                        pz,
                        qx,
                        qy,
                        qz,
                        qw,
                    },
                );

                if name.0.is_none() {
                    let message =
                        format!("{} joined the world {}", new_name, world_name.to_string());

                    info!("{}", Yellow.bold().paint(message));

                    let new_message = create_chat_message(
                        MessageType::Message,
                        ChatType::Info,
                        "",
                        format!("{} joined the game", new_name).as_str(),
                    );

                    messages.push((new_message, None, None, Some(id.0.to_owned())));
                }

                name.0 = Some(new_name.clone());
                body.set_head_position(&Vec3(px, py, pz));
                rotation.0 = Quaternion(qx, qy, qz, qw);

                if let Some(player) = players.get_mut(&id.0) {
                    player.name = Some(new_name);
                }
            }
        }

        for id in ids.join() {
            let updates = peers_update
                .iter()
                .filter(|(&i, ..)| i != id.0)
                .collect::<HashMap<_, _>>()
                .values()
                .map(|p| p.to_owned().to_owned())
                .collect::<Vec<_>>();

            if !updates.is_empty() {
                let mut components = MessageComponents::default_for(MessageType::Peer);
                components.peers = Some(updates);

                let message = create_message(components);
                messages.push((message, Some(vec![id.0]), None, Some(id.0)));
            }
        }
    }
}
