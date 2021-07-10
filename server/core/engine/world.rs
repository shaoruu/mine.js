use log::info;

use ansi_term::Colour::Yellow;
use specs::shred::{Fetch, FetchMut, Resource};

use std::time::Instant;

use specs::{Builder, DispatcherBuilder, World as ECSWorld, WorldExt};

use serde::Deserialize;

use crate::core::comp::phys::Phys;
use crate::core::engine::chunks::MeshLevel;
use crate::core::network::models::messages::{
    self, chat_message::Type as ChatType, message::Type as MessageType,
};
use crate::core::network::models::{
    create_chat_message, create_message, create_of_type, ChunkProtocol, MessageComponents,
};
use crate::core::sys::PhysicsSystem;
use crate::libs::aabb::Aabb;
use crate::libs::physics::{Physics, PhysicsOptions};
use crate::libs::rigidbody::RigidBody;
use crate::libs::types::{Quaternion, Vec2, Vec3};

use super::chunks::Chunks;
use super::clock::Clock;
use super::players::{BroadcastExt, Players};
use super::registry::Registry;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
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
    pub generation: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorldMeta {
    name: String,
    description: String,
    preload: i16,
    tick_speed: f32,
    time: f32,
}

pub struct World {
    pub ecs: ECSWorld,

    pub name: String,
    pub preload: i16,
    pub description: String,
}

impl World {
    pub fn new(json: serde_json::Value, registry: Registry) -> Self {
        let WorldMeta {
            name,
            description,
            preload,
            tick_speed,
            time,
        } = serde_json::from_value(json.clone()).unwrap();
        let config: WorldConfig = serde_json::from_value(json).unwrap();

        let mut ecs = ECSWorld::new();

        // ECS Components
        ecs.register::<Phys>();

        // ECS Resources
        ecs.insert(Chunks::new(&name, config, registry));
        ecs.insert(Clock::new(time, tick_speed));
        ecs.insert(Players::new());
        ecs.insert(Physics::new(PhysicsOptions {
            gravity: Vec3(0.0, -24.0, 0.0),
            min_bounce_impulse: 0.1,
            air_drag: 0.1,
            fluid_drag: 0.4,
            fluid_density: 2.0,
        }));

        ecs.create_entity()
            .with(Phys {
                body: RigidBody::new(
                    Aabb::new(&Vec3(0.0, 80.0, 0.0), &Vec3(0.8, 2.0, 0.8)),
                    1.0,
                    1.0,
                    0.0,
                    1.0,
                    false,
                ),
            })
            .build();

        World {
            ecs,

            name,
            preload,
            description,
        }
    }

    pub fn ecs(&self) -> &ECSWorld {
        &self.ecs
    }

    pub fn ecs_mut(&mut self) -> &mut ECSWorld {
        &mut self.ecs
    }

    pub fn read_resource<T: Resource>(&self) -> Fetch<T> {
        self.ecs.read_resource::<T>()
    }

    pub fn write_resource<T: Resource>(&mut self) -> FetchMut<T> {
        self.ecs.write_resource::<T>()
    }

    pub fn preload(&mut self) {
        let preload = self.preload;
        let name = self.name.to_owned();

        let mut chunks = self.write_resource::<Chunks>();

        let start = Instant::now();

        chunks.preload(preload);
        let duration = start.elapsed();

        info!(
            "Preloaded {} chunks for world \"{}\" in {:?}.",
            chunks.len(),
            name,
            duration
        );
    }

    pub fn broadcast(&mut self, msg: &messages::Message, exclude: Vec<usize>) {
        self.write_resource::<Players>().broadcast(msg, exclude);
    }

    pub fn on_chunk_request(&mut self, player_id: usize, msg: messages::Message) {
        let mut players = self.write_resource::<Players>();

        let json = msg.parse_json().unwrap();

        let cx = json["x"].as_i64().unwrap() as i32;
        let cz = json["z"].as_i64().unwrap() as i32;

        if let Some(player) = players.get_mut(&player_id) {
            player.requested_chunks.push_back(Vec2(cx, cz));
        }
    }

    pub fn on_config(&mut self, _player_id: usize, msg: messages::Message) {
        let mut clock = self.write_resource::<Clock>();

        let json = msg.parse_json().unwrap();

        let time = json["time"].as_f64();
        let tick_speed = json["tickSpeed"].as_f64();

        if let Some(time) = time {
            clock.time = time as f32;
        }

        if let Some(tick_speed) = tick_speed {
            clock.tick_speed = tick_speed as f32;
        }

        // damn?
        drop(clock);

        let mut new_message = create_of_type(MessageType::Config);
        new_message.json = json.to_string();

        self.broadcast(&new_message, vec![]);
    }

    pub fn on_update(&mut self, _player_id: usize, msg: messages::Message) {
        let mut chunks = self.write_resource::<Chunks>();

        let &air = chunks.registry.get_id_by_name("Air");

        let mut updates = msg.updates;
        let mut results = vec![];

        while !updates.is_empty() {
            let update = updates.pop().unwrap();

            let vx = update.vx;
            let vy = update.vy;
            let vz = update.vz;
            let id = update.r#type;

            if vy < 0 || vy >= chunks.config.max_height as i32 || !chunks.registry.has_type(id) {
                continue;
            }

            let chunk = chunks.get_chunk_by_voxel(vx, vy, vz).unwrap();
            if chunk.needs_propagation {
                continue;
            }

            let current_id = chunks.get_voxel_by_voxel(vx, vy, vz);
            if chunks.registry.is_air(current_id) && chunks.registry.is_air(id) {
                continue;
            }

            chunks.start_caching();
            chunks.update(vx, vy, vz, id);
            chunks.stop_caching();

            let neighbor_chunks = chunks.get_neighbor_chunk_coords(vx, vy, vz);
            neighbor_chunks.into_iter().for_each(|c| {
                chunks.chunk_cache.insert(c);
            });

            if chunks
                .registry
                .is_plant(chunks.get_voxel_by_voxel(vx, vy + 1, vz))
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

        let cache = chunks.chunk_cache.clone();
        chunks.clear_cache();

        drop(chunks);

        cache.iter().for_each(|coords| {
            let mut chunks = self.write_resource::<Chunks>();

            let levels = chunks.raw(&coords).unwrap().dirty_levels.clone();
            let mesh_level = MeshLevel::Levels(levels);

            let chunk = chunks.get(&coords, &mesh_level, true).unwrap();

            let mut component = MessageComponents::default_for(MessageType::Update);
            component.chunks = Some(vec![chunk.get_protocol(true, false, false, mesh_level)]);

            drop(chunks);

            let new_message = create_message(component);
            self.broadcast(&new_message, vec![]);
        });

        let chunks = self.read_resource::<Chunks>();

        // First send the message, so borrow checker doesn't freak out
        let mut components = MessageComponents::default_for(MessageType::Update);
        let chunk_protocols: Vec<ChunkProtocol> = cache
            .iter()
            .map(|coords| {
                chunks
                    .get_chunk(coords)
                    .unwrap()
                    .get_protocol(false, false, true, MeshLevel::None)
            })
            .collect();
        components.chunks = Some(chunk_protocols);
        let mut new_message = create_message(components);
        new_message.updates = results;

        drop(chunks);

        self.broadcast(&new_message, vec![]);
    }

    pub fn on_peer(&mut self, player_id: usize, msg: messages::Message) {
        let world_name = self.name.to_owned();
        let mut players = self.write_resource::<Players>();

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

        let player = players.get(&player_id);

        if player.is_none() {
            players.remove(&player_id);
            return;
        }

        let player = player.unwrap();

        let mut freshly_joined = false;

        // TODO: fix this ambiguous logic
        // means this player just joined.
        if player.name.is_none() {
            freshly_joined = true;
        }

        // borrow the player again.
        let player = players.get_mut(&player_id).unwrap();

        player.name = Some(name.to_owned());
        player.position = Vec3(*px, *py, *pz);
        player.rotation = Quaternion(*qx, *qy, *qz, *qw);

        // ! will dropping be erroneous?
        drop(players);

        if freshly_joined {
            let message = format!("{}(id={}) joined the world {}", name, player_id, world_name);

            info!("{}", Yellow.bold().paint(message));

            let new_message = create_chat_message(
                MessageType::Message,
                ChatType::Info,
                "",
                format!("{} joined the game", name).as_str(),
            );

            self.broadcast(&new_message, vec![]);
        }

        self.broadcast(&msg, vec![player_id]);
    }

    pub fn on_chat_message(&mut self, _player_id: usize, msg: messages::Message) {
        self.broadcast(&msg, vec![]);
    }

    pub fn save(&self) {
        let chunks = self.read_resource::<Chunks>();

        if chunks.config.save {
            let start = Instant::now();
            chunks.save();
            info!(
                "Auto-saving chunks for world {} took {:?}.",
                self.name,
                start.elapsed()
            );
        }
    }

    pub fn tick(&mut self) {
        // TODO: make dispatchers

        // handle game tick
        self.write_resource::<Clock>().tick();

        // handle chunk generation
        self.write_resource::<Chunks>().tick();

        let mut dispatcher = DispatcherBuilder::new()
            .with(PhysicsSystem, "physics", &[])
            .build();

        dispatcher.dispatch(&self.ecs);

        self.ecs.maintain();

        // saving the chunks
        if self.read_resource::<Clock>().tick % 8000 == 0 {
            self.save()
        }
    }
}
