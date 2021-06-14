use actix::prelude::*;
use std::collections::HashMap;

use crate::libs::types::GeneratorType;
use crate::server::Message;

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
}

impl World {
    pub fn load(json_world: serde_json::Value) -> Self {
        World {
            time: json_world["time"].as_i64().unwrap() as usize,
            name: json_world["name"].as_str().unwrap().to_owned(),
            save: json_world["save"].as_bool().unwrap(),
            tick_speed: json_world["tickSpeed"].as_i64().unwrap() as usize,
            chunk_root: json_world["chunkRoot"].as_str().unwrap().to_owned(),
            preload: json_world["preload"].as_i64().unwrap() as i32,
            chunk_size: json_world["chunkSize"].as_i64().unwrap() as usize,
            dimension: json_world["dimension"].as_i64().unwrap() as usize,
            max_height: json_world["maxHeight"].as_i64().unwrap() as usize,
            render_radius: json_world["renderRadius"].as_i64().unwrap() as usize,
            max_light_level: json_world["maxLightLevel"].as_i64().unwrap() as usize,
            max_loaded_chunks: json_world["maxLoadedChunks"].as_i64().unwrap() as i32,
            description: json_world["description"].as_str().unwrap().to_owned(),
            generation: GeneratorType::parse(json_world["generation"].as_str().unwrap()).unwrap(),
            clients: HashMap::new(),
        }
    }

    pub fn add_client(&mut self, id: usize, client: Recipient<Message>) {
        self.clients.insert(id, client);
    }
}
