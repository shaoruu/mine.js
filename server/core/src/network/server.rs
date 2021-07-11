use actix::prelude::*;
use actix_broker::BrokerSubscribe;

use log::info;

use ansi_term::Colour::Yellow;

use std::collections::{HashMap, VecDeque};
use std::fs::File;
use std::time::Duration;

use super::super::{
    engine::{
        chunks::{Chunks, MeshLevel},
        clock::Clock,
        players::{Player, Players},
        registry::Registry,
        world::{World, WorldConfig},
    },
    network::models::create_chat_message,
};

use server_common::{quaternion::Quaternion, vec::Vec3};

use server_utils::{
    convert::{map_voxel_to_chunk, map_world_to_voxel},
    json,
};

use super::message::{
    FullWorldData, GetWorld, JoinResult, JoinWorld, LeaveWorld, ListWorldNames, ListWorlds, Noop,
    PlayerMessage, SimpleWorldData,
};
use super::models::{
    create_message, messages, messages::chat_message::Type as ChatType,
    messages::message::Type as MessageType, MessageComponents,
};

const SERVER_TICK: Duration = Duration::from_millis(16);
const CHUNKING_TICK: Duration = Duration::from_millis(18);

#[derive(Default)]
pub struct WsServer {
    worlds: HashMap<String, World>,
}

impl WsServer {
    fn add_player_to_world(
        &mut self,
        world_name: &str,
        id: Option<usize>,
        player: Player,
    ) -> JoinResult {
        let mut id = id.unwrap_or_else(rand::random::<usize>);
        let world = self.worlds.get_mut(world_name).expect("World not found.");

        let mut players = world.write_resource::<Players>();

        loop {
            if players.contains_key(&id) {
                id = rand::random::<usize>();
            } else {
                break;
            }
        }

        players.insert(id, player);

        drop(players);

        let clock = world.read_resource::<Clock>();
        let chunks = world.read_resource::<Chunks>();

        JoinResult {
            id,
            time: clock.time,
            tick_speed: clock.tick_speed,
            spawn: [0, chunks.get_max_height(0, 0) as i32, 0],
            passables: chunks.registry.get_passable_solids(),
        }
    }

    fn broadcast(
        &mut self,
        world_name: &str,
        msg: &messages::Message,
        exclude: Vec<usize>,
    ) -> Option<()> {
        let world = self.worlds.get_mut(world_name)?;

        world.broadcast(msg, exclude);

        Some(())
    }

    fn tick(&mut self) {
        let mut to_generate = vec![];

        for world in self.worlds.values_mut() {
            world.tick();

            let chunks = world.read_resource::<Chunks>();

            let WorldConfig {
                chunk_size,
                dimension,
                ..
            } = *chunks.config;

            drop(chunks);

            let mut players = world.write_resource::<Players>();

            for player in players.values_mut() {
                if player.name.is_none() {
                    continue;
                }

                let current_chunk = player.current_chunk.as_ref();

                let Vec3(px, py, pz) = player.position;
                let Vec3(vx, vy, vz) = map_world_to_voxel(px, py, pz, dimension);
                let new_chunk = map_voxel_to_chunk(vx, vy, vz, chunk_size);

                if current_chunk.is_none()
                    || current_chunk.unwrap().0 != new_chunk.0
                    || current_chunk.unwrap().1 != new_chunk.1
                {
                    player.current_chunk = Some(new_chunk.clone());

                    to_generate.push((new_chunk, player.render_radius));
                }
            }

            drop(players);

            to_generate.iter().for_each(|(coords, r)| {
                world.write_resource::<Chunks>().generate(coords, *r, false)
            });
        }
    }

    fn chunking(&mut self) {
        let mut request_queue = vec![];
        let mut message_queue = VecDeque::new();

        for world in self.worlds.values_mut() {
            let world_name = world.name.to_owned();
            let mut players = world.write_resource::<Players>();

            players.iter_mut().for_each(|(id, player)| {
                if player.name.is_none() {
                    return;
                }

                let requested_chunk = player.requested_chunks.pop_front();
                request_queue.push((
                    requested_chunk.to_owned(),
                    world_name.to_owned(),
                    id.to_owned(),
                ));
            });
        }

        request_queue
            .into_iter()
            .for_each(|(coords, world_name, player_id)| {
                if let Some(coords) = coords {
                    let mut chunks = self
                        .worlds
                        .get_mut(&world_name)
                        .unwrap()
                        .write_resource::<Chunks>();
                    if let Some(chunk) = chunks.get(&coords, &MeshLevel::All, false) {
                        // SEND CHUNK BACK TO PLAYER

                        let mut component = MessageComponents::default_for(MessageType::Load);
                        component.chunks =
                            Some(vec![chunk.get_protocol(true, true, true, MeshLevel::All)]);

                        let new_message = create_message(component);
                        message_queue.push_back((world_name.to_owned(), new_message, vec![]));
                    } else {
                        drop(chunks);
                        self.worlds
                            .get_mut(&world_name)
                            .unwrap()
                            .write_resource::<Players>()
                            .get_mut(&player_id)
                            .unwrap()
                            .requested_chunks
                            .push_back(coords);
                    }
                }
            });

        message_queue
            .into_iter()
            .for_each(|(world_name, message, exclude)| {
                self.broadcast(&world_name, &message, exclude);
            })
    }
}

impl Actor for WsServer {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        ctx.set_mailbox_capacity(usize::MAX);

        self.subscribe_system_async::<LeaveWorld>(ctx);
    }
}

impl Handler<JoinWorld> for WsServer {
    type Result = MessageResult<JoinWorld>;

    fn handle(&mut self, msg: JoinWorld, _ctx: &mut Self::Context) -> Self::Result {
        let JoinWorld {
            world_name,
            player_name,
            player_addr,
            render_radius,
        } = msg;

        let new_player = Player {
            name: player_name,
            addr: player_addr,
            current_chunk: None,
            position: Vec3::default(),
            rotation: Quaternion::default(),
            requested_chunks: VecDeque::default(),
            render_radius,
        };
        let result = self.add_player_to_world(&world_name, None, new_player);

        MessageResult(result)
    }
}

impl Handler<LeaveWorld> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: LeaveWorld, _ctx: &mut Self::Context) {
        let mut message_queue = Vec::new();

        if let Some(world) = self.worlds.get_mut(&msg.world_name) {
            let world_name = world.name.to_owned();
            let mut players = world.write_resource::<Players>();

            if let Some(player) = players.remove(&msg.player_id) {
                let player_name = player.name.clone().unwrap_or_else(|| "Somebody".to_owned());

                let mut new_message = create_chat_message(
                    MessageType::Leave,
                    ChatType::Info,
                    "",
                    format!("{} left the game", player_name).as_str(),
                );
                new_message.text = msg.player_id.to_string();

                let message = format!("{} left the world {}", player_name, msg.world_name);

                info!("{}", Yellow.bold().paint(message));

                message_queue.push((world_name, new_message));
            }
        }

        message_queue.into_iter().for_each(|(world_name, message)| {
            self.broadcast(&world_name, &message, vec![]);
        })
    }
}

impl Handler<ListWorldNames> for WsServer {
    type Result = MessageResult<ListWorldNames>;

    fn handle(&mut self, _: ListWorldNames, _ctx: &mut Self::Context) -> Self::Result {
        MessageResult(self.worlds.keys().cloned().collect())
    }
}

impl Handler<PlayerMessage> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: PlayerMessage, _ctx: &mut Self::Context) {
        let PlayerMessage {
            world_name,
            player_id,
            raw,
        } = msg;

        let msg_type = messages::Message::r#type(&raw);
        let world = self.worlds.get_mut(&world_name).unwrap();

        match msg_type {
            MessageType::Request => world.on_chunk_request(player_id, raw),
            MessageType::Config => world.on_config(player_id, raw),
            MessageType::Update => world.on_update(player_id, raw),
            MessageType::Peer => world.on_peer(player_id, raw),
            MessageType::Message => world.on_chat_message(player_id, raw),
            _ => {}
        }
    }
}

impl Handler<Noop> for WsServer {
    type Result = ();

    fn handle(&mut self, _msg: Noop, _ctx: &mut Self::Context) {}
}

impl Handler<ListWorlds> for WsServer {
    type Result = MessageResult<ListWorlds>;

    fn handle(&mut self, _msg: ListWorlds, _ctx: &mut Self::Context) -> Self::Result {
        let mut data = Vec::new();

        self.worlds.values().for_each(|world| {
            let clock = world.read_resource::<Clock>();
            let chunks = world.read_resource::<Chunks>();
            let players = world.read_resource::<Players>();

            data.push(SimpleWorldData {
                name: world.name.to_owned(),
                time: clock.time,
                generation: chunks.config.generation.to_owned(),
                description: world.description.to_owned(),
                players: players.len(),
            });
        });

        data.sort_by(|a, b| a.name.partial_cmp(&b.name).unwrap());

        MessageResult(data)
    }
}

impl Handler<GetWorld> for WsServer {
    type Result = MessageResult<GetWorld>;

    fn handle(&mut self, msg: GetWorld, _ctx: &mut Self::Context) -> Self::Result {
        let world = self.worlds.get(&msg.0).expect("World not found.");

        let clock = world.read_resource::<Clock>();
        let chunks = world.read_resource::<Chunks>();

        let config = chunks.config.clone();
        let registry = chunks.registry.clone();

        MessageResult(FullWorldData {
            chunk_size: config.chunk_size,
            dimension: config.dimension,
            max_height: config.max_height,
            max_light_level: config.max_light_level,
            name: world.name.to_owned(),
            render_radius: config.render_radius,
            save: config.save,
            sub_chunks: config.sub_chunks,
            tick_speed: clock.tick_speed,
            time: clock.time,
            blocks: registry.blocks.to_owned(),
            ranges: registry.ranges.to_owned(),
            uv_side_count: registry.uv_side_count,
            uv_texture_size: registry.uv_texture_size,
        })
    }
}

impl SystemService for WsServer {
    fn service_started(&mut self, ctx: &mut Context<Self>) {
        // Loading worlds from `worlds.json`
        let mut worlds: HashMap<String, World> = HashMap::new();

        let worlds_json: serde_json::Value =
            serde_json::from_reader(File::open("metadata/worlds.json").unwrap()).unwrap();

        let world_default = &worlds_json["default"];

        let registry = Registry::new();

        for world_json in worlds_json["worlds"].as_array().unwrap() {
            let mut world_json = world_json.clone();
            json::merge(&mut world_json, world_default, false);

            let mut new_world = World::new(world_json, registry.clone());
            new_world.preload();
            worlds.insert(new_world.name.to_owned(), new_world);
        }

        self.worlds = worlds;

        ctx.run_interval(SERVER_TICK, |act, _ctx| {
            act.tick();
        });

        ctx.run_interval(CHUNKING_TICK, |act, _ctx| {
            act.chunking();
        });
    }
}

impl Supervised for WsServer {}
