use log::{debug, info};

use ansi_term::Colour::Yellow;

use std::collections::HashMap;
use std::time::{Instant, SystemTime};

use crate::core::chunks::MeshLevel;
use crate::core::message;
use crate::core::models::{
    create_chat_message, create_message, create_of_type, messages,
    messages::chat_message::Type as ChatType, messages::message::Type as MessageType,
    MessageComponents,
};
use crate::libs::types::{Coords2, Coords3, GenerationType, Quaternion};

use super::chunks::Chunks;
use super::registry::Registry;
use super::server::Client;

#[derive(Debug, Clone)]
pub struct WorldMetrics {
    pub dimension: usize,
    pub chunk_size: usize,
    pub max_height: u32,
    pub sub_chunks: u32,
    pub max_light_level: u32,
    pub render_radius: usize,
}

#[derive(Debug)]
pub struct World {
    pub time: f32,
    pub tick: i32,
    pub tick_speed: f32,

    pub name: String,
    pub save: bool,
    pub preload: i16,
    pub chunk_root: String,
    pub description: String,

    pub chunks: Chunks,
    pub clients: HashMap<usize, Client>,
    pub prev_time: SystemTime,
}

impl World {
    pub fn new(json: serde_json::Value, registry: Registry) -> Self {
        let chunk_size = json["chunkSize"].as_i64().unwrap() as usize;
        let dimension = json["dimension"].as_i64().unwrap() as usize;
        let max_height = json["maxHeight"].as_i64().unwrap() as u32;
        let max_light_level = json["maxLightLevel"].as_i64().unwrap() as u32;
        let time = json["time"].as_f64().unwrap() as f32;
        let name = json["name"].as_str().unwrap().to_owned();
        let save = json["save"].as_bool().unwrap();
        let tick_speed = json["tickSpeed"].as_f64().unwrap() as f32;
        let chunk_root = json["chunkRoot"].as_str().unwrap().to_owned();
        let preload = json["preload"].as_i64().unwrap() as i16;
        let render_radius = json["renderRadius"].as_i64().unwrap() as usize;
        let max_loaded_chunks = json["maxLoadedChunks"].as_i64().unwrap() as i32;
        let sub_chunks = json["subChunks"].as_i64().unwrap() as u32;
        let description = json["description"].as_str().unwrap().to_owned();
        let generation = GenerationType::parse(json["generation"].as_str().unwrap()).unwrap();

        let metrics = WorldMetrics {
            dimension,
            chunk_size,
            max_height,
            sub_chunks,
            max_light_level,
            render_radius,
        };

        World {
            time,
            name,
            save,
            preload,
            tick: 0,
            tick_speed,
            chunk_root,
            description,
            clients: HashMap::new(),
            chunks: Chunks::new(metrics, generation, max_loaded_chunks, registry),
            prev_time: SystemTime::now(),
        }
    }

    pub fn preload(&mut self) {
        info!(
            "Preloading world \"{}\" with radius {}...",
            self.name, self.preload
        );

        let start = Instant::now();
        self.chunks.preload(self.preload);
        let duration = start.elapsed();

        info!(
            "Preloaded {} chunks for world \"{}\" in {:?}.",
            self.chunks.len(),
            self.name,
            duration
        );
    }

    pub fn broadcast(&mut self, msg: &messages::Message, exclude: Vec<usize>) {
        let mut resting_clients = vec![];

        for (id, client) in self.clients.iter() {
            if exclude.contains(id) {
                continue;
            }

            if client
                .addr
                .do_send(message::Message(msg.to_owned()))
                .is_err()
            {
                resting_clients.push(*id);
            }
        }

        resting_clients.iter().for_each(|id| {
            self.clients.remove(id);
        })
    }

    pub fn on_chunk_request(&mut self, client_id: usize, msg: messages::Message) {
        let json = msg.parse_json().unwrap();

        let cx = json["x"].as_i64().unwrap() as i32;
        let cz = json["z"].as_i64().unwrap() as i32;

        let client = self.clients.get_mut(&client_id).unwrap();
        client.requested_chunks.push_back(Coords2(cx, cz));
    }

    pub fn on_config(&mut self, _client_id: usize, msg: messages::Message) {
        let json = msg.parse_json().unwrap();

        let time = json["time"].as_f64();
        let tick_speed = json["tickSpeed"].as_f64();

        if let Some(time) = time {
            self.time = time as f32;
        }

        if let Some(tick_speed) = tick_speed {
            self.tick_speed = tick_speed as f32;
        }

        let mut new_message = create_of_type(MessageType::Config);
        new_message.json = json.to_string();

        self.broadcast(&new_message, vec![]);
    }

    pub fn on_update(&mut self, _client_id: usize, msg: messages::Message) {
        let json = msg.parse_json().unwrap();

        let vx = json["x"].as_i64().unwrap() as i32;
        let vy = json["y"].as_i64().unwrap() as i32;
        let vz = json["z"].as_i64().unwrap() as i32;
        let id = json["type"].as_u64().unwrap() as u32;

        if vy < 0
            || vy >= self.chunks.metrics.max_height as i32
            || !self.chunks.registry.has_type(id)
        {
            return;
        }

        let chunk = self.chunks.get_chunk_by_voxel(vx, vy, vz).unwrap();
        if chunk.needs_propagation {
            return;
        }

        let current_id = self.chunks.get_voxel_by_voxel(vx, vy, vz);
        if self.chunks.registry.is_air(current_id) && self.chunks.registry.is_air(id) {
            return;
        }

        // First send the message, so borrow checker doesn't freak out
        let mut new_message = create_of_type(MessageType::Update);
        new_message.json = format!(
            "{{\"vx\":{},\"vy\":{},\"vz\":{},\"type\":{}}}",
            vx, vy, vz, id
        );

        self.broadcast(&new_message, vec![]);

        self.chunks.start_caching();
        self.chunks.update(vx, vy, vz, id);
        self.chunks.stop_caching();

        let mut cache = self.chunks.chunk_cache.to_owned();
        self.chunks.clear_cache();

        let neighbor_chunks = self.chunks.get_neighbor_chunk_coords(vx, vy, vz);
        neighbor_chunks.into_iter().for_each(|c| {
            cache.insert(c);
        });

        let WorldMetrics {
            sub_chunks,
            max_height,
            ..
        } = self.chunks.metrics;

        let sub_chunk_unit = max_height / sub_chunks;

        cache.into_iter().for_each(|coords| {
            // TODO: Fix this monstrosity of logic
            // essentially, this is fixing sub-chunk edges meshing
            let levels = if vy as u32 % sub_chunk_unit == 0 && vy != 0 {
                vec![vy as u32 / sub_chunk_unit, (vy as u32 - 1) / sub_chunk_unit]
            } else if vy as u32 % sub_chunk_unit == sub_chunk_unit - 1
                && vy as u32 != max_height - 1
            {
                vec![vy as u32 / sub_chunk_unit, (vy as u32 + 1) / sub_chunk_unit]
            } else {
                vec![vy as u32 / sub_chunk_unit]
            };
            let mesh_level = MeshLevel::Levels(levels);

            let chunk = self.chunks.get(&coords, false, &mesh_level).unwrap();

            let mut component = MessageComponents::default_for(MessageType::Update);
            component.chunks = Some(vec![chunk.get_protocol(false, mesh_level)]);

            let new_message = create_message(component);
            self.broadcast(&new_message, vec![]);
        });
    }

    pub fn on_peer(&mut self, client_id: usize, msg: messages::Message) {
        let messages::Peer {
            name,
            px,
            py,
            pz,
            qx,
            qy,
            qz,
            qw,
            ..
        } = &msg.peers[0];

        let client = self.clients.get(&client_id).unwrap();

        // TODO: fix this ambiguous logic
        // means this client just joined.
        if client.name.is_none() {
            let message = format!("{}(id={}) joined the world {}", name, client_id, self.name);

            info!("{}", Yellow.bold().paint(message));

            let new_message = create_chat_message(
                MessageType::Message,
                ChatType::Info,
                "",
                format!("{} joined the game", name).as_str(),
            );

            self.broadcast(&new_message, vec![]);
        }

        // borrow the client again.
        let client = self.clients.get_mut(&client_id).unwrap();

        client.name = Some(name.to_owned());
        client.position = Coords3(*px, *py, *pz);
        client.rotation = Quaternion(*qx, *qy, *qz, *qw);

        self.broadcast(&msg, vec![client_id]);
    }

    pub fn on_chat_message(&mut self, _client_id: usize, msg: messages::Message) {
        self.broadcast(&msg, vec![]);
    }

    pub fn tick(&mut self) {
        let now = SystemTime::now();

        let delta = now
            .duration_since(self.prev_time)
            .expect("Clock may have gone backwards")
            .as_millis() as f32
            / 1000.0;

        self.time = (self.time + self.tick_speed * delta) % 2400.0;
        self.tick += 1;

        self.prev_time = now;
    }
}
