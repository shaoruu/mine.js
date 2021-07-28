use actix::prelude::*;
use actix_broker::BrokerSubscribe;

use std::collections::HashMap;
use std::time::Duration;

use crate::engine::config::Configs;
use crate::engine::entities::Entities;
use crate::engine::world::{WorldConfig, WorldMeta};

use super::super::engine::{chunks::Chunks, clock::Clock, players::Players, world::World};

use super::message::{
    FullWorldData, GetWorld, JoinWorld, LeaveWorld, ListWorldNames, ListWorlds, Noop,
    PlayerMessage, SimpleWorldData,
};
use super::models::{messages, messages::message::Type as MessageType};

#[derive(Default)]
pub struct WsServer {
    worlds: HashMap<String, World>,
}

impl WsServer {
    fn load_worlds(&mut self) {
        // Loading worlds from `worlds.json`
        let mut worlds: HashMap<String, World> = HashMap::new();
        let (configs, registry) = Configs::load_worlds("assets/metadata/worlds.json");

        configs.into_iter().for_each(|(_, (meta, config))| {
            let mut new_world = World::new(meta, config, registry.to_owned());
            new_world.preload();
            worlds.insert(new_world.name.to_owned(), new_world);
        });

        self.worlds = worlds;
    }

    fn start_worlds(&mut self, ctx: &mut Context<Self>) -> Vec<SpawnHandle> {
        let mut processes = vec![];

        for world in self.worlds.values_mut() {
            let tick_rate = world.read_resource::<WorldConfig>().server_tick_rate;
            processes.push((world.name.to_owned(), tick_rate));
        }

        let mut intervals = vec![];

        processes.into_iter().for_each(|(name, tick_rate)| {
            intervals.push(
                ctx.run_interval(Duration::from_millis(tick_rate), move |act, _ctx| {
                    act.worlds.get_mut(&name).unwrap().tick();
                }),
            );
        });

        intervals
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
        } = msg;

        let world = self.worlds.get_mut(&world_name).expect("World not found!");
        let result = world.add_player(None, player_name, player_addr);

        MessageResult(result)
    }
}

impl Handler<LeaveWorld> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: LeaveWorld, _ctx: &mut Self::Context) {
        if let Some(world) = self.worlds.get_mut(&msg.world_name) {
            world.remove_player(&msg.player_id);
        }
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
        let entities = world.read_resource::<Entities>();
        let meta = world.read_resource::<WorldMeta>();

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
            entities: entities.get_all(),
            uv_side_count: registry.uv_side_count,
            uv_texture_size: registry.uv_texture_size,
            packs: meta.packs.to_owned(),
        })
    }
}

impl SystemService for WsServer {
    fn service_started(&mut self, ctx: &mut Context<Self>) {
        self.load_worlds();
        self.start_worlds(ctx);
    }
}

impl Supervised for WsServer {}
