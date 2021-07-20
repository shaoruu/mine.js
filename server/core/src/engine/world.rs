#![allow(dead_code)]

use actix::Recipient;
use log::info;

use ansi_term::Colour::Yellow;
use server_common::quaternion::Quaternion;
use specs::shred::{Fetch, FetchMut, Resource};

use std::io::Write;
use std::time::Instant;
use std::{collections::VecDeque, fs::File};

use specs::{Builder, DispatcherBuilder, World as ECSWorld, WorldExt};

use serde::{Deserialize, Serialize};

use crate::comp::curr_chunk::CurrChunk;
use crate::comp::etype::EType;
use crate::comp::id::Id;
use crate::comp::lookat::LookAt;
use crate::comp::name::Name;
use crate::comp::rotation::Rotation;
use crate::comp::view_radius::ViewRadius;
use crate::network::models::ChatType;
use crate::sys::{
    BroadcastSystem, ChunkingSystem, EntitiesSystem, GenerationSystem, ObserveSystem, PeersSystem,
    SearchSystem,
};
use crate::{
    comp::rigidbody::RigidBody,
    network::message::{JoinResult, Message},
};

use super::entities::Entities;
use super::kdtree::KdTree;
use super::{
    super::{
        constants::WORLD_DATA_FILE,
        engine::chunks::MeshLevel,
        network::models::{
            create_chat_message, create_message, create_of_type, messages, ChunkProtocol,
            MessageComponents, MessageType,
        },
        sys::PhysicsSystem,
    },
    physics::{Physics, PhysicsOptions},
    players::Player,
};

use server_common::{
    aabb::Aabb,
    vec::{Vec2, Vec3},
};

use super::chunks::Chunks;
use super::clock::Clock;
use super::players::{BroadcastExt, PlayerUpdates, Players};
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

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WorldData {
    time: f32,
    tick_speed: f32,
}

pub struct World {
    pub ecs: ECSWorld,

    pub name: String,
    pub preload: i16,
    pub description: String,
}

pub type MessagesQueue = Vec<(
    messages::Message,
    Option<Vec<usize>>,
    Option<Vec<usize>>,
    Option<usize>,
)>;

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
        ecs.register::<Id>();
        ecs.register::<Name>();
        ecs.register::<RigidBody>();
        ecs.register::<Rotation>();
        ecs.register::<CurrChunk>();
        ecs.register::<ViewRadius>();
        ecs.register::<LookAt>();
        ecs.register::<EType>();

        // ECS Resources
        ecs.insert(name.to_owned());
        ecs.insert(Chunks::new(&name, config.clone(), registry));
        ecs.insert(Clock::new(time, tick_speed));
        ecs.insert(KdTree::new());
        ecs.insert(Players::new());
        ecs.insert(PlayerUpdates::new());
        ecs.insert(MessagesQueue::new());
        ecs.insert(Entities::new());
        ecs.insert(Physics::new(PhysicsOptions {
            gravity: Vec3(0.0, -24.0, 0.0),
            min_bounce_impulse: 0.1,
            air_drag: 0.1,
            fluid_drag: 0.4,
            fluid_density: 2.0,
        }));
        ecs.insert(config.clone());

        let mut new_world = World {
            ecs,

            name,
            preload,
            description,
        };

        if config.save {
            new_world.sync_config();
            new_world.save();
        }

        new_world
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

    pub fn add_player(
        &mut self,
        id: Option<usize>,
        player_name: Option<String>,
        player_addr: Recipient<Message>,
        render_radius: i16,
    ) -> JoinResult {
        let mut id = id.unwrap_or_else(rand::random::<usize>);

        let clock = self.read_resource::<Clock>();
        let chunks = self.read_resource::<Chunks>();

        let time = clock.time;
        let tick_speed = clock.tick_speed;
        let spawn = [0, chunks.get_max_height(0, 0) as i32, 0];
        let passables = chunks.registry.get_passable_solids();

        drop(clock);
        drop(chunks);

        let players = self.read_resource::<Players>();

        loop {
            if players.contains_key(&id) {
                id = rand::random::<usize>();
            } else {
                break;
            }
        }

        drop(players);

        let entity = self
            .ecs_mut()
            .create_entity()
            .with(Id::new(id.to_owned()))
            .with(Name::new(&player_name))
            .with(RigidBody::new(
                Aabb::new(
                    &Vec3(spawn[0] as f32, spawn[1] as f32, spawn[2] as f32),
                    &Vec3(0.8, 2.0, 0.8),
                ),
                1.0,
                1.0,
                0.0,
                0.0,
                false,
            ))
            .with(Rotation::new(0.0, 0.0, 0.0, 0.0))
            .with(CurrChunk::new())
            .with(ViewRadius::new(render_radius))
            .build();

        let mut players = self.write_resource::<Players>();

        let new_player = Player {
            entity,
            name: player_name,
            addr: player_addr,
            requested_chunks: VecDeque::default(),
        };

        players.insert(id, new_player);

        JoinResult {
            id,
            time,
            tick_speed,
            spawn,
            passables,
        }
    }

    pub fn remove_player(&mut self, player_id: &usize) {
        let name = self.name.to_owned();
        let mut players = self.write_resource::<Players>();
        let mut message_queue = Vec::new();

        let player = players.remove(player_id);

        if player.is_none() {
            return;
        }

        let player = player.unwrap();
        drop(players);

        let player_name = player.name.unwrap_or_else(|| "Somebody".to_owned());

        self.ecs_mut()
            .delete_entity(player.entity)
            .expect("Error removing player entity...");

        let mut new_message = create_chat_message(
            MessageType::Leave,
            ChatType::Info,
            "",
            format!("{} left the game", player_name).as_str(),
        );
        new_message.text = player_id.to_string();

        let message = format!("{} left the world {}", player_name, name);

        info!("{}", Yellow.bold().paint(message));

        message_queue.push(new_message);

        message_queue.into_iter().for_each(|message| {
            self.broadcast(&message, vec![], vec![]);
        })
    }

    pub fn broadcast(&mut self, msg: &messages::Message, include: Vec<usize>, exclude: Vec<usize>) {
        self.write_resource::<Players>()
            .broadcast(msg, include, exclude, None);
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

        self.broadcast(&new_message, vec![], vec![]);
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
            self.broadcast(&new_message, vec![], vec![]);
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

        self.broadcast(&new_message, vec![], vec![]);
    }

    pub fn on_peer(&mut self, player_id: usize, msg: messages::Message) {
        let mut player_updates = self.write_resource::<PlayerUpdates>();
        player_updates.insert(player_id, msg.peers[0].clone());
    }

    pub fn on_chat_message(&mut self, player_id: usize, msg: messages::Message) {
        if let Some(message) = msg.message.clone() {
            let sender: String = message.sender;
            let body: String = message.body;

            info!("{}: {}", sender, body);

            if body.starts_with('/') {
                let body = body
                    .strip_prefix('/')
                    .unwrap()
                    .split_whitespace()
                    .collect::<Vec<_>>();

                let mut msgs = vec![];

                let create_msg = |chat_type: ChatType, body: &str| {
                    create_chat_message(MessageType::Message, chat_type, "", body)
                };

                if body.is_empty() {
                    msgs.push(create_msg(ChatType::Error, "Unknown command."));
                } else {
                    match body[0] {
                        "save" => {
                            self.save();
                            msgs.push(create_msg(ChatType::Info, "World has been saved."));
                        }
                        "summon" => {
                            self.test_entity(player_id);
                            msgs.push(create_msg(ChatType::Info, "Summoned a test entity."))
                        }
                        _ => {}
                    }
                }

                msgs.into_iter().for_each(|msg| {
                    self.broadcast(&msg, vec![], vec![]);
                });
            } else {
                self.broadcast(&msg, vec![], vec![]);
            }
        }
    }

    pub fn test_entity(&mut self, player_id: usize) {
        let players = self.read_resource::<Players>();
        let player = players.get(&player_id);

        if player.is_none() {
            return;
        }

        let player = player.unwrap();

        let bodies = self.ecs().read_component::<RigidBody>();
        let body = bodies.get(player.entity).unwrap();

        let pos = body.get_position();

        drop(bodies);
        drop(players);

        let entities = self.read_resource::<Entities>();
        let prototype = entities
            .get_prototype("Test")
            .unwrap_or_else(|| panic!("Prototype not found: Test"))
            .clone();

        drop(entities);

        Entities::spawn_entity(
            &prototype,
            self.ecs_mut(),
            "Test",
            &Vec3(pos.0, pos.1 + 20.0, pos.2),
            &Quaternion(0.0, 0.0, 0.0, 0.0),
        );

        // self.ecs_mut()
        //     .create_entity()
        //     .with(EType::new("Test"))
        //     .with(RigidBody::new(
        //         Aabb::new( &Vec3(0.2, 0.2, 0.2)),
        //         1.0,
        //         1.0,
        //         0.0,
        //         1.0,
        //         false,
        //     ))
        //     .with(Rotation::new(0.0, 0.0, 0.0, 0.0))
        //     .with(CurrChunk::new())
        //     .build();
    }

    pub fn sync_config(&mut self) {
        let chunks = self.read_resource::<Chunks>();

        let mut path = chunks.root_folder.clone();
        path.push(WORLD_DATA_FILE);

        drop(chunks);

        if let Ok(file) = File::open(path) {
            let WorldData { time, tick_speed } = serde_json::from_reader(file).unwrap();
            let mut clock = self.write_resource::<Clock>();

            clock.set_time(time);
            clock.set_tick_speed(tick_speed);
        }
    }

    pub fn save(&self) {
        let chunks = self.read_resource::<Chunks>();
        let clock = self.read_resource::<Clock>();

        if chunks.config.save {
            // saving world data
            let mut root = chunks.root_folder.clone();
            root.push(WORLD_DATA_FILE);

            let mut file = File::create(root.into_os_string().into_string().unwrap())
                .expect("Could not create world config.");

            let data = WorldData {
                time: clock.time,
                tick_speed: clock.tick_speed,
            };

            let j = serde_json::to_string(&data).unwrap();

            file.write_all(j.as_bytes())
                .expect("Unable to save world data");

            // saving chunks
            chunks.save();

            // info!(
            //     "Saving data for world \"{}\" took {:?}.",
            //     self.name,
            //     start.elapsed()
            // );
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
            .with(PeersSystem, "peers", &["physics"])
            .with(ChunkingSystem, "chunking", &["peers"])
            .with(GenerationSystem, "generation", &["chunking"])
            .with(SearchSystem, "search", &["peers"])
            .with(ObserveSystem, "observe", &["search"])
            .with(EntitiesSystem, "entities", &["chunking"])
            .with(BroadcastSystem, "broadcast", &["peers"])
            .build();

        dispatcher.dispatch(&self.ecs);

        self.ecs.maintain();

        // saving the chunks
        if self.read_resource::<Clock>().tick % 8000 == 0 {
            self.save()
        }
    }
}
