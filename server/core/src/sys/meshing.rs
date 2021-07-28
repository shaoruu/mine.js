use specs::{System, WriteExpect};

use crate::{
    engine::{
        chunks::{Chunks, MeshLevel},
        players::Players,
        world::MessagesQueue,
    },
    network::models::{create_message, MessageComponents, MessageType},
};

pub struct MeshingSystem;

impl<'a> System<'a> for MeshingSystem {
    type SystemData = (
        WriteExpect<'a, Players>,
        WriteExpect<'a, MessagesQueue>,
        WriteExpect<'a, Chunks>,
    );

    fn run(&mut self, data: Self::SystemData) {
        let (mut players, mut messages, mut chunks) = data;

        let mut request_queue = vec![];

        players.iter_mut().for_each(|(id, player)| {
            if player.name.is_none() {
                return;
            }

            let requested_chunk = player.requested_chunks.pop_front();
            request_queue.push((requested_chunk, id.to_owned()));
        });

        request_queue.into_iter().for_each(|(coords, player_id)| {
            if let Some(coords) = coords {
                if let Some(chunk) = chunks.get(&coords, &MeshLevel::All, false) {
                    // SEND CHUNK BACK TO PLAYER

                    let mut component = MessageComponents::default_for(MessageType::Load);
                    component.chunks =
                        Some(vec![chunk.get_protocol(true, true, true, MeshLevel::All)]);

                    let new_message = create_message(component);
                    messages.push((new_message, Some(vec![player_id]), None, None));
                } else {
                    players
                        .get_mut(&player_id)
                        .unwrap()
                        .requested_chunks
                        .push_back(coords);
                }
            }
        });
    }
}
