use actix::prelude::*;
use actix_broker::BrokerSubscribe;
use log::debug;
use serde::Serialize;

use std::collections::{HashMap, VecDeque};
use std::fs::File;
use std::time::Duration;

use crate::core::models::{create_chat_message, create_of_type};
use crate::core::world::World;
use crate::libs::types::{Coords2, Coords3, GeneratorType, Quaternion};
use crate::utils::convert::{map_voxel_to_chunk, map_world_to_voxel};
use crate::utils::json;

use super::message::{
    self, ChatMessage, ConfigWorld, GetWorld, JoinResult, JoinWorld, LeaveWorld, ListWorldNames,
    ListWorlds, PlayerUpdate, SendMessage, UpdateVoxel, WorldData,
};
use super::models::{
    create_message, messages, messages::chat_message::Type as ChatType, MessageComponents,
    PeerProtocol,
};
use super::registry::Registry;
use super::world::WorldMetrics;

const SERVER_TICK: Duration = Duration::from_millis(16);

#[derive(Debug)]
pub struct Client {
    pub name: Option<String>,
    pub addr: Recipient<message::Message>,
    pub position: Coords3<f32>,
    pub rotation: Quaternion,
    pub current_chunk: Option<Coords2<i32>>,
    pub requested_chunks: VecDeque<Coords2<i32>>,
    pub render_radius: i16,
}

#[derive(Debug, Default)]
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
        msg: &message::Message,
        exclude: Vec<usize>,
    ) -> Option<()> {
        let world = self.worlds.get_mut(world_name)?;

        let mut resting_clients = vec![];

        for (id, client) in world.clients.iter() {
            if exclude.contains(id) {
                continue;
            }

            if client.addr.do_send(msg.to_owned()).is_err() {
                resting_clients.push(*id);
            }
        }

        // remove the clients that aren't responding
        resting_clients.iter().for_each(|id| {
            world.clients.remove(id);
        });

        Some(())
    }

    fn tick(&mut self) {
        let mut message_queue = VecDeque::new();

        for world in self.worlds.values_mut() {
            world.tick();

            let peers: Vec<PeerProtocol> = world
                .clients
                .iter()
                .map(|(id, c)| PeerProtocol {
                    id: id.to_string(),
                    name: c.name.to_owned().unwrap_or_else(|| "lol".to_owned()),
                    px: c.position.0,
                    py: c.position.1,
                    pz: c.position.2,
                    qx: c.rotation.0,
                    qy: c.rotation.1,
                    qz: c.rotation.2,
                    qw: c.rotation.3,
                })
                .collect();
            let mut peers_components =
                MessageComponents::default_for(messages::message::Type::Peer);
            peers_components.peers = Some(peers);
            let peers_message = create_message(peers_components);
            message_queue.push_front((
                world.name.to_owned(),
                message::Message(peers_message),
                vec![],
            ));

            let WorldMetrics {
                chunk_size,
                dimension,
                ..
            } = world.chunks.metrics;

            for client in world.clients.values_mut() {
                if client.name.is_none() {
                    continue;
                }

                let current_chunk = client.current_chunk.as_ref();

                let Coords3(px, py, pz) = client.position;
                let Coords3(vx, vy, vz) = map_world_to_voxel(px, py, pz, dimension);
                let new_chunk = map_voxel_to_chunk(vx, vy, vz, chunk_size);

                if current_chunk.is_none()
                    || current_chunk.unwrap().0 != new_chunk.0
                    || current_chunk.unwrap().1 != new_chunk.1
                {
                    client.current_chunk = Some(new_chunk.clone());

                    // tell world to regenerate
                    world.chunks.generate(&new_chunk, client.render_radius);
                }

                let requested_chunk = client.requested_chunks.pop_front();

                if let Some(coords) = requested_chunk {
                    let chunk = world.chunks.get(&coords, true);

                    if chunk.is_none() {
                        client.requested_chunks.push_back(coords);
                    } else {
                        // SEND CHUNK BACK TO CLIENT

                        let mut component =
                            MessageComponents::default_for(messages::message::Type::Update);
                        component.chunks = Some(vec![chunk.unwrap().get_protocol(true)]);

                        let new_message = create_message(component);
                        message_queue.push_back((
                            world.name.to_owned(),
                            message::Message(new_message),
                            vec![],
                        ));
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
        self.subscribe_system_async::<SendMessage>(ctx);
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
            position: Coords3::default(),
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
        if let Some(world) = self.worlds.get_mut(&msg.world_name) {
            world.clients.remove(&msg.client_id);
        }
    }
}

impl Handler<ListWorldNames> for WsServer {
    type Result = MessageResult<ListWorldNames>;

    fn handle(&mut self, _: ListWorldNames, _ctx: &mut Self::Context) -> Self::Result {
        MessageResult(self.worlds.keys().cloned().collect())
    }
}

impl Handler<PlayerUpdate> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: PlayerUpdate, _ctx: &mut Self::Context) -> Self::Result {
        let PlayerUpdate {
            world_name,
            client_id,

            name,
            position,
            rotation,
            chunk,
        } = msg;

        let world = self
            .worlds
            .get_mut(world_name.as_str())
            .expect("World not found.");
        let client = world
            .clients
            .get_mut(&client_id)
            .expect("Client not found.");

        let mut newly_joined = false;

        if name.is_some() {
            if client.name.is_none() {
                newly_joined = true;
            }

            client.name = name.clone();
        }

        if let Some(rotation) = rotation {
            client.rotation = rotation;
        }

        if let Some(position) = position {
            client.position = position;
        }

        if let Some(chunk) = chunk {
            client.requested_chunks.push_back(chunk);
        }

        if newly_joined {
            let new_message = create_chat_message(
                ChatType::Info,
                "",
                format!("{} joined the game", name.unwrap()).as_str(),
            );

            self.broadcast(&world_name, &message::Message(new_message), vec![]);
        }
    }
}

impl Handler<ChatMessage> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: ChatMessage, _ctx: &mut Self::Context) {
        let ChatMessage {
            world_name,
            message,
        } = msg;

        let mut new_message = create_of_type(messages::message::Type::Message);
        new_message.message = Some(message);

        self.broadcast(&world_name, &message::Message(new_message), vec![]);
    }
}

impl Handler<ConfigWorld> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: ConfigWorld, _ctx: &mut Self::Context) {
        let ConfigWorld {
            world_name,
            time,
            tick_speed,
            json,
        } = msg;

        let world = self.worlds.get_mut(&world_name).expect("World not found.");

        if let Some(time) = time {
            world.time = time as f32;
        }

        if let Some(tick_speed) = tick_speed {
            world.tick_speed = tick_speed as f32;
        }

        let mut new_message = create_of_type(messages::message::Type::Config);
        new_message.json = json.to_string();

        self.broadcast(&world_name, &message::Message(new_message), vec![]);
    }
}

impl Handler<UpdateVoxel> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: UpdateVoxel, _ctx: &mut Self::Context) {
        let UpdateVoxel {
            world_name,
            vx,
            vy,
            vz,
            id,
        } = msg;

        let world = self.worlds.get_mut(&world_name).expect("World not found.");

        if vy < 0
            || vy >= world.chunks.metrics.max_height as i32
            || !world.chunks.registry.has_type(id)
        {
            return;
        }

        let chunk = world.chunks.get_chunk_by_voxel(vx, vy, vz).unwrap();
        if chunk.needs_propagation {
            return;
        }

        let current_id = world.chunks.get_voxel_by_voxel(vx, vy, vz);
        if world.chunks.registry.is_air(current_id) && world.chunks.registry.is_air(id) {
            return;
        }

        // First send the message, so borrow checker doesn't freak out
        let mut new_message = create_of_type(messages::message::Type::Update);
        new_message.json = format!(
            "{{\"vx\":{},\"vy\":{},\"vz\":{},\"type\":{}}}",
            vx, vy, vz, id
        );

        self.broadcast(&world_name, &message::Message(new_message), vec![]);

        // then borrow again
        let world = self.worlds.get_mut(&world_name).expect("World not found.");

        world.chunks.start_caching();
        world.chunks.update(vx, vy, vz, id);
        world.chunks.stop_caching();

        let mut cache = world.chunks.chunk_cache.to_owned();
        world.chunks.clear_cache();

        let neighbor_chunks = world.chunks.get_neighbor_chunk_coords(vx, vy, vz);
        neighbor_chunks.into_iter().for_each(|c| {
            cache.insert(c);
        });

        cache.into_iter().for_each(|coords| {
            let chunk = self
                .worlds
                .get_mut(&world_name)
                .unwrap()
                .chunks
                .get(&coords, false)
                .unwrap();

            let mut component = MessageComponents::default_for(messages::message::Type::Update);
            component.chunks = Some(vec![chunk.get_protocol(false)]);

            let new_message = create_message(component);
            self.broadcast(&world_name, &message::Message(new_message), vec![]);
        });
    }
}

impl Handler<SendMessage> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: SendMessage, _ctx: &mut Self::Context) {
        let SendMessage {
            world_name,
            content,
            ..
        } = msg;

        self.broadcast(&world_name, &message::Message(content), vec![]);
    }
}

fn make_world_data(world: &World) -> WorldData {
    WorldData {
        name: world.name.to_owned(),
        time: world.time,
        generation: match world.generation {
            GeneratorType::FLAT => "flat".to_owned(),
            GeneratorType::HILLY => "hilly".to_owned(),
        },
        description: world.description.to_owned(),
        players: world.clients.len(),
    }
}

impl Handler<ListWorlds> for WsServer {
    type Result = MessageResult<ListWorlds>;

    fn handle(&mut self, _msg: ListWorlds, _ctx: &mut Self::Context) -> Self::Result {
        let mut data = Vec::new();

        self.worlds.iter().for_each(|(name, world)| {
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
    }
}

impl Supervised for WsServer {}
