use log::{debug, info};

use crossbeam_channel::{unbounded, Receiver, Sender};

use ansi_term::Colour::Yellow;

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Instant, SystemTime};

use crate::core::engine::chunks::MeshLevel;
use crate::core::gen::generator::Generator;
use crate::core::gen::lights::Lights;
use crate::core::gen::mesher::Mesher;
use crate::core::network::message;
use crate::core::network::models::messages::{
    self, chat_message::Type as ChatType, message::Type as MessageType,
};
use crate::core::network::models::{
    create_chat_message, create_message, create_of_type, MessageComponents,
};
use crate::core::network::server::Client;
use crate::libs::types::GenerationType;
use crate::libs::types::{Quaternion, Vec2, Vec3};

use super::chunk::{Chunk, Meshes};
use super::chunks::Chunks;
use super::registry::Registry;
use super::space::Space;

#[derive(Debug, Clone)]
pub struct WorldConfig {
    pub chunk_size: usize,
    pub dimension: usize,
    pub max_height: u32,
    pub max_light_level: u32,
    pub save: bool,
    pub chunk_root: String,
    pub render_radius: usize,
    pub max_loaded_chunks: i32,
    pub sub_chunks: u32,
    pub generation: GenerationType,
}

pub struct World {
    pub time: f32,
    pub tick: i32,
    pub tick_speed: f32,

    pub name: String,
    pub preload: i16,
    pub description: String,

    pub chunks: Chunks,
    pub clients: HashMap<usize, Client>,
    pub prev_time: SystemTime,

    // multithread stuff
    pub gen_sender: Arc<Sender<Vec<Chunk>>>,
    pub gen_receiver: Arc<Receiver<Vec<Chunk>>>,
    pub mesh_sender: Arc<Sender<Vec<Chunk>>>,
    pub mesh_receiver: Arc<Receiver<Vec<Chunk>>>,
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

        let config = WorldConfig {
            chunk_size,
            dimension,
            max_height,
            max_light_level,
            save,
            chunk_root,
            render_radius,
            max_loaded_chunks,
            sub_chunks,
            generation,
        };

        let clients = HashMap::new();
        let chunks = Chunks::new(config, max_loaded_chunks, registry);
        let prev_time = SystemTime::now();

        let (gen_sender, gen_receiver) = unbounded();
        let gen_sender = Arc::new(gen_sender);
        let gen_receiver = Arc::new(gen_receiver);

        let (mesh_sender, mesh_receiver) = unbounded();
        let mesh_sender = Arc::new(mesh_sender);
        let mesh_receiver = Arc::new(mesh_receiver);

        World {
            time,
            tick: 0,
            tick_speed,

            name,
            preload,
            description,

            clients,
            chunks,
            prev_time,

            gen_sender,
            gen_receiver,
            mesh_sender,
            mesh_receiver,
        }
    }

    pub fn preload(&mut self) {
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

        if let Some(client) = self.clients.get_mut(&client_id) {
            client.requested_chunks.push_back(Vec2(cx, cz));
        }
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
        let air = *self.chunks.registry.get_id_by_name("Air");

        let mut updates = msg.updates;
        let mut results = vec![];

        while !updates.is_empty() {
            let update = updates.pop().unwrap();

            let vx = update.vx;
            let vy = update.vy;
            let vz = update.vz;
            let id = update.r#type;

            if vy < 0
                || vy >= self.chunks.config.max_height as i32
                || !self.chunks.registry.has_type(id)
            {
                continue;
            }

            let chunk = self.chunks.get_chunk_by_voxel(vx, vy, vz).unwrap();
            if chunk.needs_propagation {
                continue;
            }

            let current_id = self.chunks.get_voxel_by_voxel(vx, vy, vz);
            if self.chunks.registry.is_air(current_id) && self.chunks.registry.is_air(id) {
                continue;
            }

            self.chunks.start_caching();
            self.chunks.update(vx, vy, vz, id);
            self.chunks.stop_caching();

            let neighbor_chunks = self.chunks.get_neighbor_chunk_coords(vx, vy, vz);
            neighbor_chunks.into_iter().for_each(|c| {
                self.chunks.chunk_cache.insert(c);
            });

            if self
                .chunks
                .registry
                .is_plant(self.chunks.get_voxel_by_voxel(vx, vy + 1, vz))
            {
                updates.push(messages::Update {
                    vx,
                    vy: vy + 1,
                    vz,
                    r#type: air,
                });
            }

            results.push(update);
        }

        self.chunks
            .chunk_cache
            .clone()
            .into_iter()
            .for_each(|coords| {
                let levels = self.chunks.raw(&coords).unwrap().dirty_levels.clone();
                let mesh_level = MeshLevel::Levels(levels);

                let chunk = self.chunks.get(&coords, &mesh_level, true).unwrap();

                let mut component = MessageComponents::default_for(MessageType::Update);
                component.chunks = Some(vec![chunk.get_protocol(false, mesh_level)]);

                let new_message = create_message(component);
                self.broadcast(&new_message, vec![]);
            });

        self.chunks.clear_cache();

        // First send the message, so borrow checker doesn't freak out
        let mut new_message = create_of_type(MessageType::Update);
        new_message.updates = results;
        self.broadcast(&new_message, vec![]);
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

        let client = self.clients.get(&client_id);

        if client.is_none() {
            self.clients.remove(&client_id);
            return;
        }

        let client = client.unwrap();

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
        client.position = Vec3(*px, *py, *pz);
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

        if !self.chunks.to_mesh.is_empty() {
            let to_mesh: Vec<(Chunk, Space)> = self
                .chunks
                .to_mesh
                .iter()
                .map(|coords| {
                    (
                        self.chunks.get_chunk(coords).unwrap().clone(),
                        Space::new(
                            &self.chunks,
                            &coords,
                            self.chunks.config.max_light_level as usize,
                        ),
                    )
                })
                .collect();

            let sender = self.mesh_sender.clone();
            let config = self.chunks.config.clone();
            let registry = self.chunks.registry.clone();

            rayon::spawn(move || {
                let meshed = to_mesh
                    .into_iter()
                    .map(|(mut chunk, space)| {
                        if chunk.needs_propagation {
                            let lights = Lights::calc_light(&space, &registry, &config);
                            chunk.needs_propagation = false;
                            chunk.needs_saving = true;
                            chunk.set_lights(lights);
                        }

                        let sub_chunks = config.sub_chunks;

                        chunk.meshes = Vec::new();

                        for sub_chunk in 0..sub_chunks {
                            let opaque =
                                Mesher::mesh_chunk(&chunk, false, sub_chunk, &config, &registry);
                            let transparent =
                                Mesher::mesh_chunk(&chunk, true, sub_chunk, &config, &registry);

                            chunk.meshes.push(Meshes {
                                opaque,
                                transparent,
                                sub_chunk: sub_chunk as i32,
                            });

                            chunk.is_dirty = false;
                        }

                        chunk
                    })
                    .collect();

                sender.send(meshed).unwrap();
            });

            self.chunks.to_mesh.clear();
        }

        if !self.chunks.to_generate.is_empty() {
            let chunks = self.chunks.to_generate.clone();
            self.chunks.to_generate.clear();

            let sender = self.gen_sender.clone();
            let config = self.chunks.config.clone();
            let registry = self.chunks.registry.clone();

            rayon::spawn(move || {
                let chunks: Vec<Chunk> = chunks
                    .into_iter()
                    .map(|mut chunk| {
                        Generator::generate_chunk(&mut chunk, &registry, &config);
                        Generator::generate_chunk_height_map(&mut chunk, &registry, &config);
                        chunk
                    })
                    .collect();
                sender.send(chunks).unwrap();
            });
        }

        if let Ok(chunks) = self.mesh_receiver.try_recv() {
            chunks.into_iter().for_each(|c| {
                self.chunks.add_chunk(c);
            })
        }

        if let Ok(chunks) = self.gen_receiver.try_recv() {
            chunks.into_iter().for_each(|c| {
                self.chunks.add_chunk(c);
            })
        }
    }
}
