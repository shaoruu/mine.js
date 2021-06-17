use actix::prelude::*;
use std::collections::HashMap;

use crate::libs::types::GeneratorType;
use crate::server::Message;

use super::chunks::Chunks;
use super::registry::Registry;

#[derive(Debug, Clone)]
pub struct WorldMetrics {
    pub dimension: usize,
    pub chunk_size: usize,
    pub max_height: usize,
    pub max_light_level: u8,
    pub render_radius: usize,
}

#[derive(Debug)]
pub struct World {
    pub time: usize,
    pub tick_speed: usize,

    pub name: String,
    pub save: bool,
    pub preload: i32,
    pub chunk_root: String,
    pub description: String,

    pub generation: GeneratorType,

    pub chunks: Chunks,
    pub clients: HashMap<usize, Recipient<Message>>,
}

impl World {
    pub fn new(json: serde_json::Value, registry: Registry) -> Self {
        let chunk_size = json["chunkSize"].as_i64().unwrap() as usize;
        let max_height = json["maxHeight"].as_i64().unwrap() as usize;
        let dimension = json["dimension"].as_i64().unwrap() as usize;
        let max_light_level = json["maxLightLevel"].as_i64().unwrap() as u8;
        let time = json["time"].as_i64().unwrap() as usize;
        let name = json["name"].as_str().unwrap().to_owned();
        let save = json["save"].as_bool().unwrap();
        let tick_speed = json["tickSpeed"].as_i64().unwrap() as usize;
        let chunk_root = json["chunkRoot"].as_str().unwrap().to_owned();
        let preload = json["preload"].as_i64().unwrap() as i32;
        let render_radius = json["renderRadius"].as_i64().unwrap() as usize;
        let max_loaded_chunks = json["maxLoadedChunks"].as_i64().unwrap() as i32;
        let description = json["description"].as_str().unwrap().to_owned();
        let generation = GeneratorType::parse(json["generation"].as_str().unwrap()).unwrap();

        let metrics = WorldMetrics {
            chunk_size,
            dimension,
            max_height,
            render_radius,
            max_light_level,
        };

        let new_world = World {
            time,
            name,
            save,
            preload,
            tick_speed,
            chunk_root,
            generation,
            description,
            clients: HashMap::new(),
            chunks: Chunks::new(metrics, max_loaded_chunks, registry),
        };

        new_world
    }

    // pub fn on_config(&mut self, id: usize, client)

    pub fn add_client(&mut self, id: usize, client: Recipient<Message>) {
        self.clients.insert(id, client);
    }
}
