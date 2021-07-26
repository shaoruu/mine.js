use std::{collections::HashMap, fs::File};

use server_utils::json;

use super::world::{WorldConfig, WorldMeta};

pub struct Configs;

impl Configs {
    pub fn load_worlds(path: &str) -> HashMap<String, (WorldMeta, WorldConfig)> {
        let worlds_json: serde_json::Value =
            serde_json::from_reader(File::open(path).unwrap()).unwrap();

        let world_default = &worlds_json["default"];

        let mut map = HashMap::new();

        for world_json in worlds_json["worlds"].as_array().unwrap() {
            let mut world_json = world_json.clone();
            json::merge(&mut world_json, world_default, false);

            let meta: WorldMeta = serde_json::from_value(world_json.clone()).unwrap();
            let config: WorldConfig = serde_json::from_value(world_json).unwrap();

            map.insert(meta.name.to_owned(), (meta, config));
        }

        map
    }
}
