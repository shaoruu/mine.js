use rand::{self, rngs::ThreadRng, Rng};

use actix::prelude::*;

use std::collections::HashMap;
use std::fs::File;

use crate::core::world::World;
use crate::utils::json;

use super::message;
use super::registry::Registry;

#[derive(Debug)]
pub struct WsServer {
    clients: HashMap<usize, Recipient<message::Message>>,
    worlds: HashMap<String, World>,
    rng: ThreadRng,
}

impl WsServer {
    pub fn new() -> WsServer {
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

        WsServer {
            worlds,
            clients: HashMap::new(),
            rng: rand::thread_rng(),
        }
    }

    pub fn send_message(&self, world: &str, message: &str, skip_id: usize) {
        if let Some(world) = self.worlds.get(world) {
            for (id, recipient) in &world.clients {
                if *id != skip_id {
                    recipient
                        .do_send(message::Message(message.to_owned()))
                        .unwrap();
                }
            }
        }
    }
}

impl Actor for WsServer {
    type Context = Context<Self>;
}

impl Handler<message::Connect> for WsServer {
    type Result = MessageResult<message::Connect>;

    fn handle(&mut self, msg: message::Connect, _: &mut Context<Self>) -> Self::Result {
        println!("Someone joined");

        // TODO: send join message here.
        self.send_message(&"Main".to_owned(), "Someone joined", 0);

        // register session with random id
        let id = self.rng.gen::<usize>();
        self.clients.insert(id, msg.addr.clone()); // ? NOT SURE IF THIS WORKS

        let world_name = msg.world_name;
        let world = self.worlds.get_mut(&world_name).unwrap();
        world.add_client(id, msg.addr.to_owned());

        MessageResult(message::ConnectionResult {
            id,
            metrics: world.chunks.metrics.clone(),
        })
    }
}

impl Handler<message::ListWorlds> for WsServer {
    type Result = MessageResult<message::ListWorlds>;

    fn handle(&mut self, _: message::ListWorlds, _: &mut Context<Self>) -> Self::Result {
        let mut worlds = Vec::new();

        for key in self.worlds.keys() {
            worlds.push(key.to_owned());
        }

        MessageResult(worlds)
    }
}

impl Handler<message::Generate> for WsServer {
    type Result = ();

    fn handle(&mut self, data: message::Generate, _: &mut Context<Self>) {
        let message::Generate {
            coords,
            render_radius,
            world,
        } = data;

        let world = self.worlds.get_mut(&world).unwrap();
        world.chunks.generate(coords, render_radius);
    }
}

impl Handler<message::ChunkRequest> for WsServer {
    type Result = MessageResult<message::ChunkRequest>;

    fn handle(&mut self, request: message::ChunkRequest, _: &mut Context<Self>) -> Self::Result {
        let message::ChunkRequest {
            world,
            coords,
            needs_voxels,
        } = request;

        let world = self.worlds.get_mut(&world).unwrap();

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

impl Handler<message::Disconnect> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: message::Disconnect, _: &mut Context<Self>) {
        let mut worlds: Vec<String> = Vec::new();

        // remove address
        if self.clients.remove(&msg.id).is_some() {
            // remove session from all rooms
            for world in self.worlds.values_mut() {
                let id = world.clients.remove_entry(&msg.id);
                if id.is_some() {
                    worlds.push(world.name.to_owned());
                }
            }
        }

        for world in worlds {
            self.send_message(&world, "Someone disconnected", 0)
        }
    }
}
