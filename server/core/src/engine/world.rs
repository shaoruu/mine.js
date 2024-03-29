#![allow(dead_code)]

use actix::Recipient;
use log::info;

use ansi_term::Colour::Yellow;

use specs::shred::{Fetch, FetchMut, Resource};

use std::io::Write;
use std::time::Instant;
use std::{collections::VecDeque, fs::File};

use specs::{Builder, DispatcherBuilder, World as ECSWorld, WorldExt};

use serde::{Deserialize, Serialize};

use server_common::quaternion::Quaternion;

use crate::comp::brain::Brain;
use crate::comp::curr_chunk::CurrChunk;
use crate::comp::etype::EType;
use crate::comp::id::Id;
use crate::comp::name::Name;
use crate::comp::rotation::Rotation;
use crate::comp::target::Target;
use crate::comp::view_radius::ViewRadius;
use crate::comp::walk_towards::WalkTowards;
use crate::network::models::{create_of_type, ChatType};
use crate::sys::{
    BroadcastSystem, ChunkingSystem, EntitiesSystem, GenerationSystem, MeshingSystem,
    ObserveSystem, PathFindSystem, PeersSystem, SearchSystem, WalkTowardsSystem,
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
            create_chat_message, create_message, messages, ChunkProtocol, MessageComponents,
            MessageType,
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

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WorldData {
    time: f32,
    tick_speed: f32,
}

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
    pub max_loaded_chunks: usize,
    pub sub_chunks: u32,
    pub generation: String,
    pub player_dimensions: Vec3<f32>,
    pub player_head: f32,
    pub max_per_thread: usize,
    pub server_tick_rate: u64,
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorldMeta {
    pub name: String,
    pub description: String,
    pub preload: i16,
    pub tick_speed: f32,
    pub time: f32,

    #[serde(default)]
    pub packs: Vec<String>,
}
/// A single voxel-based and ECS-based world
pub struct World {
    pub ecs: ECSWorld,

    pub name: String,
    pub preload: i16,
    pub description: String,
}

/// Resource of messages to be broadcasted per tick
pub type MessagesQueue = Vec<(
    messages::Message,  // actual message
    Option<Vec<usize>>, // include
    Option<Vec<usize>>, // exclude
    Option<usize>,      // by who
)>;

impl World {
    /// Instantiate a new voxel world, registers the necessary components and resources
    ///
    /// Attempts to save the world data to its corresponding JSON file.
    pub fn new(meta: WorldMeta, config: WorldConfig, registry: Registry) -> Self {
        let WorldMeta {
            name,
            description,
            preload,
            tick_speed,
            time,
            ..
        } = meta.clone();

        let mut ecs = ECSWorld::new();

        // ECS Components
        ecs.register::<Brain>();
        ecs.register::<CurrChunk>();
        ecs.register::<EType>();
        ecs.register::<Id>();
        ecs.register::<Target>();
        ecs.register::<Name>();
        ecs.register::<RigidBody>();
        ecs.register::<Rotation>();
        ecs.register::<ViewRadius>();
        ecs.register::<WalkTowards>();

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
        ecs.insert(meta);

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

    /// Getter for world's internal ECS world
    pub fn ecs(&self) -> &ECSWorld {
        &self.ecs
    }

    /// Getter for a mutable reference to world's internal ECS world
    pub fn ecs_mut(&mut self) -> &mut ECSWorld {
        &mut self.ecs
    }

    /// Read an ECS resource generically
    pub fn read_resource<T: Resource>(&self) -> Fetch<T> {
        self.ecs.read_resource::<T>()
    }

    /// Write an ECS resource generically
    pub fn write_resource<T: Resource>(&mut self) -> FetchMut<T> {
        self.ecs.write_resource::<T>()
    }

    /// Preload chunks around `0,0` on start
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

    /// Add a new player, signaled from the server
    pub fn add_player(
        &mut self,
        id: Option<usize>,
        player_name: Option<String>,
        player_addr: Recipient<Message>,
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

        let config = self.read_resource::<WorldConfig>();
        let dimension = config.player_dimensions.clone();
        let render_radius = config.render_radius as i16;
        let head = config.player_head;

        drop(config);

        let entity = self
            .ecs_mut()
            .create_entity()
            .with(Id::new(id.to_owned()))
            .with(Name::new(&player_name))
            .with(RigidBody::new(
                Aabb::new(
                    &Vec3(spawn[0] as f32, spawn[1] as f32, spawn[2] as f32),
                    &dimension,
                ),
                head,
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

    /// Remove a player, signaled from the server
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

    /// Broadcast a message instantly
    ///
    /// Suggested against, use message_queue instead.
    pub fn broadcast(&mut self, msg: &messages::Message, include: Vec<usize>, exclude: Vec<usize>) {
        self.write_resource::<Players>()
            .broadcast(msg, include, exclude, None);
    }

    /// Adds a message to the message queue
    ///
    /// Message will be sent per tick, in a lazy fashion.
    pub fn broadcast_lazy(
        &mut self,
        msg: &messages::Message,
        include: Vec<usize>,
        exclude: Vec<usize>,
        from: usize,
    ) {
        self.write_resource::<MessagesQueue>().push((
            msg.to_owned(),
            Some(include),
            Some(exclude),
            Some(from),
        ))
    }

    /// Handles server-side chunk request
    pub fn on_chunk_request(&mut self, player_id: usize, msg: messages::Message) {
        let mut players = self.write_resource::<Players>();

        let json = msg.parse_json().unwrap();

        let cx = json["x"].as_i64().unwrap() as i32;
        let cz = json["z"].as_i64().unwrap() as i32;

        if let Some(player) = players.get_mut(&player_id) {
            player.requested_chunks.push_back(Vec2(cx, cz));
        }
    }

    /// Handles server-side config change
    pub fn on_config(&mut self, player_id: usize, msg: messages::Message) {
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

        self.broadcast_lazy(&new_message, vec![], vec![], player_id);
    }

    /// Handles server-side voxel updates
    ///
    /// Remesh chunks based on which sub-chunks are changed according to internal
    /// chunk caching system.
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
            let rotation = update.rotation;
            let y_rotation = update.y_rotation;

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
            chunks.update(vx, vy, vz, id, rotation, y_rotation);
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
                    rotation: 0,
                    y_rotation: 0,
                });
            }

            results.push(update);
        }

        let cache = chunks.chunk_cache.clone();
        chunks.clear_cache();

        drop(chunks);

        let mut chunk_mesh_protocols = vec![];

        cache.iter().for_each(|coords| {
            let mut chunks = self.write_resource::<Chunks>();

            let levels = chunks.raw(&coords).unwrap().dirty_levels.clone();
            let mesh_level = MeshLevel::Levels(levels);

            let chunk = chunks.get(&coords, &mesh_level, true).unwrap();
            chunk_mesh_protocols.push(chunk.get_protocol(true, false, false, mesh_level));

            drop(chunks);
        });

        let chunks = self.read_resource::<Chunks>();

        // First send the message, so borrow checker doesn't freak out
        let mut components = MessageComponents::default_for(MessageType::Update);
        let mut chunk_protocols: Vec<ChunkProtocol> = cache
            .iter()
            .map(|coords| {
                chunks
                    .get_chunk(coords)
                    .unwrap()
                    .get_protocol(false, false, true, MeshLevel::None)
            })
            .collect();
        chunk_protocols.append(&mut chunk_mesh_protocols);
        components.chunks = Some(chunk_protocols);
        let mut new_message = create_message(components);
        new_message.updates = results;

        drop(chunks);

        self.broadcast(&new_message, vec![], vec![]);
    }

    /// Adds the player update to the resource `PlayerUpdate`, handled later in an ECS system.
    pub fn on_peer(&mut self, player_id: usize, msg: messages::Message) {
        let mut player_updates = self.write_resource::<PlayerUpdates>();
        player_updates.insert(player_id, msg.peers[0].clone());
    }

    /// Handles an incoming chat message, broadcasts response lazily
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
                            msgs.push(create_msg(ChatType::Info, "Summoned a test entity."));
                        }
                        _ => {}
                    }
                }

                msgs.into_iter().for_each(|msg| {
                    self.broadcast_lazy(&msg, vec![], vec![], player_id);
                });
            } else {
                self.broadcast_lazy(&msg, vec![], vec![], player_id);
            }
        }
    }

    /// TEST:
    ///
    /// Used to test entity spawning
    pub fn test_entity(&mut self, player_id: usize) {
        let players = self.read_resource::<Players>();
        let player = players.get(&player_id);

        if player.is_none() {
            return;
        }

        let player = player.unwrap();

        let bodies = self.ecs().read_component::<RigidBody>();
        let body = bodies.get(player.entity).unwrap();

        let pos = body.get_head_position();

        drop(bodies);
        drop(players);

        let entities = self.read_resource::<Entities>();
        let prototype = entities
            .get_prototype("Test")
            .unwrap_or_else(|| panic!("Prototype not found: Test"))
            .clone();

        drop(entities);

        Entities::spawn_entity(
            self.ecs_mut(),
            &prototype,
            "Test",
            &Vec3(pos.0, pos.1, pos.2),
            &Quaternion(0.0, 0.0, 0.0, 0.0),
        );
    }

    /// Sync configurations to the world's JSON file
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

    /// Saves the world. Things done:
    ///
    /// 1. Saves the world configs (`time`, `tick_speed`, ...etc)
    /// 2. Save all chunks within `chunks` to their corresponding JSON files
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

    /// A world tick
    ///
    /// 1. Tick resources
    ///     - `Clock`
    ///     - `Chunks`
    /// 2. Dispatch all ECS systems
    /// 3. Periodically save the world
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
            .with(MeshingSystem, "meshing", &["generation"])
            .with(SearchSystem, "search", &["peers"])
            .with(ObserveSystem, "observe", &["search"])
            .with(EntitiesSystem, "entities", &["chunking"])
            .with(PathFindSystem, "pathfind", &["observe"])
            .with(BroadcastSystem, "broadcast", &["peers"])
            .with(WalkTowardsSystem, "walk_towards", &["pathfind"])
            .build();

        dispatcher.dispatch(&self.ecs);

        self.ecs.maintain();

        // saving the chunks
        if self.read_resource::<Clock>().tick % 8000 == 0 {
            self.save()
        }
    }
}
