use log::{debug, info};

use std::collections::HashMap;
use std::time::{Instant, SystemTime};

use crate::libs::types::GenerationType;

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
