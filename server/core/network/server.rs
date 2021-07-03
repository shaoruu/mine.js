use actix::prelude::*;
use actix_broker::BrokerSubscribe;

use log::info;

use ansi_term::Colour::Yellow;

use std::collections::{HashMap, VecDeque};
use std::fs::File;
use std::time::Duration;

use crate::core::engine::chunks::MeshLevel;
use crate::core::engine::registry::Registry;
use crate::core::engine::world::{World, WorldConfig};
use crate::core::network::models::create_chat_message;
use crate::libs::types::{GenerationType, Quaternion, Vec2, Vec3};
use crate::utils::convert::{map_voxel_to_chunk, map_world_to_voxel};
use crate::utils::json;

use super::message::{
    self, GetWorld, JoinResult, JoinWorld, LeaveWorld, ListWorldNames, ListWorlds, Noop,
    PlayerMessage, WorldData,
};
use super::models::{
    create_message, messages, messages::chat_message::Type as ChatType,
    messages::message::Type as MessageType, MessageComponents,
};

const SERVER_TICK: Duration = Duration::from_millis(16);
const CHUNKING_TICK: Duration = Duration::from_millis(18);

#[derive(Debug)]
pub struct Client {
    pub name: Option<String>,
    pub addr: Recipient<message::Message>,
    pub position: Vec3<f32>,
    pub rotation: Quaternion,
    pub current_chunk: Option<Vec2<i32>>,
    pub requested_chunks: VecDeque<Vec2<i32>>,
    pub render_radius: i16,
}

#[derive(Default)]
pub struct WsServer {
    worlds: HashMap<String, World>,
}

impl WsServer {
    fn add_client_to_world(
        &mut self,
        world_name: &str,
        id: Option<usize>,
        client: Client,
    ) -> JoinResult {
        let mut id = id.unwrap_or_else(rand::random::<usize>);
        let world = self.worlds.get_mut(world_name).expect("World not found.");

        loop {
            if world.clients.contains_key(&id) {
                id = rand::random::<usize>();
            } else {
                break;
            }
        }

        world.clients.insert(id, client);

        JoinResult {
            id,
            time: world.time,
            tick_speed: world.tick_speed,
            spawn: [0, world.chunks.get_max_height(0, 0), 0],
            passables: world.chunks.registry.get_passable_solids(),
        }
    }

    fn broadcast(
        &mut self,
        world_name: &str,
        msg: &messages::Message,
        exclude: Vec<usize>,
    ) -> Option<()> {
        let world = self.worlds.get_mut(world_name)?;

        world.broadcast(msg, exclude);

        Some(())
    }

    fn tick(&mut self) {
        for world in self.worlds.values_mut() {
            world.tick();

            let WorldConfig {
                chunk_size,
                dimension,
                ..
            } = *world.chunks.config;

            for client in world.clients.values_mut() {
                if client.name.is_none() {
                    continue;
                }

                let current_chunk = client.current_chunk.as_ref();

                let Vec3(px, py, pz) = client.position;
                let Vec3(vx, vy, vz) = map_world_to_voxel(px, py, pz, dimension);
                let new_chunk = map_voxel_to_chunk(vx, vy, vz, chunk_size);

                if current_chunk.is_none()
                    || current_chunk.unwrap().0 != new_chunk.0
                    || current_chunk.unwrap().1 != new_chunk.1
                {
                    client.current_chunk = Some(new_chunk.clone());

                    // tell world to regenerate
                    world
                        .chunks
                        .generate(&new_chunk, client.render_radius, false);
                }
            }
        }
    }

    fn chunking(&mut self) {
        let mut message_queue = VecDeque::new();

        for world in self.worlds.values_mut() {
            for client in world.clients.values_mut() {
                if client.name.is_none() {
                    continue;
                }

                let requested_chunk = client.requested_chunks.pop_front();

                if let Some(coords) = requested_chunk {
                    let chunk = world.chunks.get(&coords, &MeshLevel::All, false);

                    if chunk.is_none() {
                        client.requested_chunks.push_back(coords);
                    } else {
                        // SEND CHUNK BACK TO CLIENT

                        let mut component = MessageComponents::default_for(MessageType::Load);
                        component.chunks =
                            Some(vec![chunk.unwrap().get_protocol(true, MeshLevel::All)]);

                        let new_message = create_message(component);
                        message_queue.push_back((world.name.to_owned(), new_message, vec![]));
                    }
                }
            }
        }

        message_queue
            .into_iter()
            .for_each(|(world_name, message, exclude)| {
                self.broadcast(&world_name, &message, exclude);
            })
    }
}

impl Actor for WsServer {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        ctx.set_mailbox_capacity(usize::MAX);

        self.subscribe_system_async::<LeaveWorld>(ctx);
    }
}

impl Handler<JoinWorld> for WsServer {
    type Result = MessageResult<JoinWorld>;

    fn handle(&mut self, msg: JoinWorld, _ctx: &mut Self::Context) -> Self::Result {
        let JoinWorld {
            world_name,
            client_name,
            client_addr,
            render_radius,
        } = msg;

        let new_client = Client {
            name: client_name,
            addr: client_addr,
            current_chunk: None,
            position: Vec3::default(),
            rotation: Quaternion::default(),
            requested_chunks: VecDeque::default(),
            render_radius,
        };
        let result = self.add_client_to_world(&world_name, None, new_client);

        MessageResult(result)
    }
}

impl Handler<LeaveWorld> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: LeaveWorld, _ctx: &mut Self::Context) {
        let mut message_queue = Vec::new();

        if let Some(world) = self.worlds.get_mut(&msg.world_name) {
            let client = world.clients.remove(&msg.client_id);
            if let Some(client) = client {
                let client_name = client.name.clone().unwrap_or_else(|| "Somebody".to_owned());

                let mut new_message = create_chat_message(
                    MessageType::Leave,
                    ChatType::Info,
                    "",
                    format!("{} left the game", client_name).as_str(),
                );
                new_message.text = msg.client_id.to_string();

                let message = format!(
                    "{}(id={}) left the world {}",
                    client_name, msg.client_id, msg.world_name
                );

                info!("{}", Yellow.bold().paint(message));

                message_queue.push((world.name.to_owned(), new_message));
            }
        }

        message_queue.into_iter().for_each(|(world_name, message)| {
            self.broadcast(&world_name, &message, vec![]);
        })
    }
}

impl Handler<ListWorldNames> for WsServer {
    type Result = MessageResult<ListWorldNames>;

    fn handle(&mut self, _: ListWorldNames, _ctx: &mut Self::Context) -> Self::Result {
        MessageResult(self.worlds.keys().cloned().collect())
    }
}

impl Handler<PlayerMessage> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: PlayerMessage, _ctx: &mut Self::Context) {
        let PlayerMessage {
            world_name,
            client_id,
            raw,
        } = msg;

        let msg_type = messages::Message::r#type(&raw);
        let world = self.worlds.get_mut(&world_name).unwrap();

        match msg_type {
            MessageType::Request => world.on_chunk_request(client_id, raw),
            MessageType::Config => world.on_config(client_id, raw),
            MessageType::Update => world.on_update(client_id, raw),
            MessageType::Peer => world.on_peer(client_id, raw),
            MessageType::Message => world.on_chat_message(client_id, raw),
            _ => {}
        }
    }
}

impl Handler<Noop> for WsServer {
    type Result = ();

    fn handle(&mut self, _msg: Noop, _ctx: &mut Self::Context) {}
}

fn make_world_data(world: &World) -> WorldData {
    WorldData {
        name: world.name.to_owned(),
        time: world.time,
        generation: match world.chunks.config.generation {
            GenerationType::FLAT => "flat".to_owned(),
            GenerationType::HILLY => "hilly".to_owned(),
        },
        description: world.description.to_owned(),
        players: world.clients.len(),
    }
}

impl Handler<ListWorlds> for WsServer {
    type Result = MessageResult<ListWorlds>;

    fn handle(&mut self, _msg: ListWorlds, _ctx: &mut Self::Context) -> Self::Result {
        let mut data = Vec::new();

        self.worlds.values().for_each(|world| {
            data.push(make_world_data(world));
        });

        MessageResult(data)
    }
}

impl Handler<GetWorld> for WsServer {
    type Result = MessageResult<GetWorld>;

    fn handle(&mut self, msg: GetWorld, _ctx: &mut Self::Context) -> Self::Result {
        let world = self.worlds.get(&msg.0).expect("World not found.");

        MessageResult(make_world_data(world))
    }
}

impl SystemService for WsServer {
    fn service_started(&mut self, ctx: &mut Context<Self>) {
        // Loading worlds from `worlds.json`
        let mut worlds: HashMap<String, World> = HashMap::new();

        let worlds_json: serde_json::Value =
            serde_json::from_reader(File::open("metadata/worlds.json").unwrap()).unwrap();

        let world_default = &worlds_json["default"];

        let registry = Registry::new();

        for world_json in worlds_json["worlds"].as_array().unwrap() {
            let mut world_json = world_json.clone();
            json::merge(&mut world_json, world_default, false);

            let mut new_world = World::new(world_json, registry.clone());
            new_world.preload();
            worlds.insert(new_world.name.to_owned(), new_world);
        }

        self.worlds = worlds;

        ctx.run_interval(SERVER_TICK, |act, _ctx| {
            act.tick();
        });

        ctx.run_interval(CHUNKING_TICK, |act, _ctx| {
            act.chunking();
        });
    }
}

impl Supervised for WsServer {}
