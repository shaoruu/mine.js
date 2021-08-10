use hashbrown::HashMap;

use std::fs::{self, File};

use server_utils::json;

use super::{
    registry::Registry,
    world::{WorldConfig, WorldMeta},
};

pub struct Configs;

impl Configs {
    pub fn load_worlds(path: &str) -> (HashMap<String, (WorldMeta, WorldConfig)>, Registry) {
        let worlds_json: serde_json::Value =
            serde_json::from_reader(File::open(path).unwrap()).unwrap();

        let world_default = &worlds_json["shared"];

        let mut map = HashMap::new();

        let packs = fs::read_dir("./assets/textures/packs/").unwrap();
        let packs = packs
            .flatten()
            .map(|e| e.file_name().into_string().unwrap())
            .collect::<Vec<_>>();

        for world_json in worlds_json["worlds"].as_array().unwrap() {
            let mut world_json = world_json.clone();
            json::merge(&mut world_json, world_default, false);

            let mut meta: WorldMeta = serde_json::from_value(world_json.clone()).unwrap();
            let config: WorldConfig = serde_json::from_value(world_json).unwrap();

            meta.packs = packs.clone();

            map.insert(meta.name.to_owned(), (meta, config));
        }

        if map.is_empty() {
            panic!("No configs found!");
        }

        let registry = Registry::new(packs, true);

        (map, registry)
    }
}
