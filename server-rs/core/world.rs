use log::info;

use actix::prelude::*;
use std::collections::HashMap;
use std::time::Instant;

use crate::libs::types::GeneratorType;

use super::chunks::Chunks;
use super::message;
use super::registry::Registry;
use super::server::Client;

#[derive(Debug, Clone)]
pub struct WorldMetrics {
    pub dimension: usize,
    pub chunk_size: usize,
    pub max_height: usize,
    pub max_light_level: u32,
    pub render_radius: usize,
}

#[derive(Debug)]
pub struct World {
    pub time: usize,
    pub tick_speed: usize,

    pub name: String,
    pub save: bool,
    pub preload: i16,
    pub chunk_root: String,
    pub description: String,

    pub generation: GeneratorType,

    pub chunks: Chunks,
    pub clients: HashMap<usize, Client>,
}

impl World {
    pub fn new(json: serde_json::Value, registry: Registry) -> Self {
        let chunk_size = json["chunkSize"].as_i64().unwrap() as usize;
        let max_height = json["maxHeight"].as_i64().unwrap() as usize;
        let dimension = json["dimension"].as_i64().unwrap() as usize;
        let max_light_level = json["maxLightLevel"].as_i64().unwrap() as u32;
        let time = json["time"].as_i64().unwrap() as usize;
        let name = json["name"].as_str().unwrap().to_owned();
        let save = json["save"].as_bool().unwrap();
        let tick_speed = json["tickSpeed"].as_i64().unwrap() as usize;
        let chunk_root = json["chunkRoot"].as_str().unwrap().to_owned();
        let preload = json["preload"].as_i64().unwrap() as i16;
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

    pub fn add_client(&mut self, id: usize, client: Recipient<message::Message>) {
        self.clients.insert(id, client);
    }
}
