use actix::prelude::*;
use actix_broker::BrokerSubscribe;

use std::collections::{HashMap, VecDeque};
use std::fs::File;
use std::time::Duration;

use crate::core::world::World;
use crate::libs::types::{Coords2, Coords3, Quaternion};
use crate::utils::convert::{map_voxel_to_chunk, map_world_to_voxel};
use crate::utils::json;

use super::message::{
    self, ChatMessage, JoinResult, JoinWorld, LeaveWorld, ListWorlds, PlayerUpdate, SendMessage,
};
use super::models::{create_message, messages, MessageComponents};
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

        JoinResult { id }
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
        for world in self.worlds.values_mut() {
            world.tick();

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
                let new_chunk = map_voxel_to_chunk(
                    &&map_world_to_voxel(&client.position, dimension),
                    chunk_size,
                );

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
                    let chunk = world.chunks.get(&coords);

                    if chunk.is_none() {
                        client.requested_chunks.push_back(coords);
                    } else {
                        // SEND CHUNK BACK TO CLIENT
                    }
                }
            }
        }
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

        // TODO: SEND "SOMEONE JOINED" MESSAGE

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

impl Handler<ListWorlds> for WsServer {
    type Result = MessageResult<ListWorlds>;

    fn handle(&mut self, _: ListWorlds, _ctx: &mut Self::Context) -> Self::Result {
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

        client.name = name;

        if let Some(rotation) = rotation {
            client.rotation = rotation;
        }

        if let Some(position) = position {
            client.position = position;
        }

        if let Some(chunk) = chunk {
            client.requested_chunks.push_back(chunk);
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

        let mut new_message = create_message(MessageComponents::default_for(
            messages::message::Type::Message,
        ));

        new_message.message = Some(message);

        self.broadcast(&world_name, &message::Message(new_message), vec![]);
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
