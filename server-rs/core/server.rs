use log::info;

use actix::prelude::*;
use actix_broker::BrokerSubscribe;

use std::collections::HashMap;
use std::fs::File;

use crate::core::world::World;
use crate::utils::json;

use super::message::{
    self, ChunkRequest, Generate, JoinResult, JoinWorld, LeaveWorld, ListWorlds, SendMessage,
};
use super::registry::Registry;

pub type Client = Recipient<message::Message>;

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
            metrics: world.chunks.metrics.clone(),
        }
    }

    fn send_message(
        &mut self,
        world_name: &str,
        msg: &message::Message,
        _from: usize,
    ) -> Option<()> {
        let world = self.worlds.get_mut(world_name)?;

        let mut resting_clients = vec![];

        for (id, client) in world.clients.iter() {
            if client.do_send(msg.to_owned()).is_err() {
                resting_clients.push(*id);
            }
        }

        // remove the clients that aren't responding
        resting_clients.iter().for_each(|id| {
            world.clients.remove(id);
        });

        Some(())
    }
}

impl Actor for WsServer {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
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
            client,
        } = msg;

        let result = self.add_client_to_world(&world_name, None, client);

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

impl Handler<SendMessage> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: SendMessage, _ctx: &mut Self::Context) {
        let SendMessage {
            world_name,
            client_id,
            content,
        } = msg;

        self.send_message(&world_name, &message::Message(content), client_id);
    }
}

impl Handler<Generate> for WsServer {
    type Result = ();

    fn handle(&mut self, data: Generate, _: &mut Context<Self>) {
        let Generate {
            coords,
            render_radius,
            world_name,
        } = data;

        let world = self.worlds.get_mut(&world_name).unwrap();
        world.chunks.generate(coords, render_radius);
    }
}

impl Handler<ChunkRequest> for WsServer {
    type Result = MessageResult<message::ChunkRequest>;

    fn handle(&mut self, request: ChunkRequest, _: &mut Context<Self>) -> Self::Result {
        let ChunkRequest {
            world_name,
            needs_voxels,
            coords,
        } = request;

        let world = self.worlds.get_mut(&world_name).unwrap();
        let chunk = world.chunks.get(&coords);

        if chunk.is_none() {
            return MessageResult(message::ChunkRequestResult { protocol: None });
        }

        let chunk = chunk.unwrap();

        // TODO: OPTIMIZE THIS? CLONE?
        MessageResult(message::ChunkRequestResult {
            protocol: Some(chunk.get_protocol(needs_voxels)),
        })
    }
}

impl SystemService for WsServer {
    fn service_started(&mut self, ctx: &mut Context<Self>) {
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
    }
}
impl Supervised for WsServer {}
