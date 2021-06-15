use actix::prelude::*;
use std::collections::HashMap;

use crate::libs::types::GeneratorType;
use crate::server::Message;

use super::chunks::Chunks;
use super::registry::Registry;

#[derive(Debug)]
pub struct World {
    pub time: usize,
    pub save: bool,
    pub name: String,
    pub tick_speed: usize,
    pub chunk_root: String,
    pub preload: i32,
    pub dimension: usize,
    pub chunk_size: usize,
    pub max_height: usize,
    pub render_radius: usize,
    pub max_light_level: usize,
    pub max_loaded_chunks: i32,
    pub generation: GeneratorType,
    pub description: String,
    pub clients: HashMap<usize, Recipient<Message>>,
    pub chunks: Chunks,
}

impl World {
    pub fn new(json: serde_json::Value, registry: Registry) -> Self {
        let chunk_size = json["chunkSize"].as_i64().unwrap() as usize;
        let max_height = json["maxHeight"].as_i64().unwrap() as usize;

        World {
            chunk_size,
            max_height,

            time: json["time"].as_i64().unwrap() as usize,
            name: json["name"].as_str().unwrap().to_owned(),
            save: json["save"].as_bool().unwrap(),
            tick_speed: json["tickSpeed"].as_i64().unwrap() as usize,
            chunk_root: json["chunkRoot"].as_str().unwrap().to_owned(),
            preload: json["preload"].as_i64().unwrap() as i32,
            dimension: json["dimension"].as_i64().unwrap() as usize,
            render_radius: json["renderRadius"].as_i64().unwrap() as usize,
            max_light_level: json["maxLightLevel"].as_i64().unwrap() as usize,
            max_loaded_chunks: json["maxLoadedChunks"].as_i64().unwrap() as i32,
            description: json["description"].as_str().unwrap().to_owned(),
            generation: GeneratorType::parse(json["generation"].as_str().unwrap()).unwrap(),

            clients: HashMap::new(),
            chunks: Chunks::new(chunk_size, max_height, registry),
        }
    }

    pub fn add_client(&mut self, id: usize, client: Recipient<Message>) {
        self.clients.insert(id, client);
    }
}
