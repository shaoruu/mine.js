use serde::{Deserialize, Serialize};

use actix::prelude::*;

use crate::engine::entities::EntityPrototypes;

use super::super::engine::registry::{Blocks, Ranges};

use super::models;

/// Base actor message to derive from
#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct Message(pub models::messages::Message);

/* -------------------------------------------------------------------------- */
/*                             Connection Messages                            */
/* -------------------------------------------------------------------------- */
#[derive(MessageResponse)]
pub struct JoinResult {
    pub id: usize,
    pub time: f32,
    pub tick_speed: f32,
    pub spawn: [i32; 3],
    pub passables: Vec<u32>,
}

#[derive(Clone, Message)]
#[rtype(result = "JoinResult")]
pub struct JoinWorld {
    pub world_name: String,
    pub player_name: Option<String>,
    pub player_addr: Recipient<Message>,
    pub render_radius: i16,
}

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct LeaveWorld {
    pub world_name: String,
    pub player_id: usize,
}

/* -------------------------------------------------------------------------- */
/*                             Game Play Messages                             */
/* -------------------------------------------------------------------------- */

/// Whenever a protobuf message is received, player will send the message to server
#[derive(Clone, Message, Default)]
#[rtype(result = "()")]
pub struct PlayerMessage {
    pub world_name: String,
    pub player_id: usize,

    pub raw: models::messages::Message,
}

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct Noop;

/* -------------------------------------------------------------------------- */
/*                              Routing Messages                              */
/* -------------------------------------------------------------------------- */
#[derive(Clone, Message)]
#[rtype(result = "Vec<String>")]
pub struct ListWorldNames;

#[derive(MessageResponse, Deserialize, Serialize, Debug)]
pub struct SimpleWorldData {
    pub name: String,
    pub time: f32,
    pub generation: String,
    pub description: String,
    pub players: usize,
}

#[derive(MessageResponse, Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FullWorldData {
    pub chunk_size: usize,
    pub dimension: usize,
    pub max_height: u32,
    pub max_light_level: u32,
    pub time: f32,
    pub name: String,
    pub save: bool,
    pub tick_speed: f32,
    pub render_radius: usize,
    pub sub_chunks: u32,
    pub blocks: Blocks,
    pub ranges: Ranges,
    pub entities: EntityPrototypes,
    pub uv_side_count: u32,
    pub uv_texture_size: u32,
}

#[derive(Clone, Message)]
#[rtype(result = "Vec<SimpleWorldData>")]
pub struct ListWorlds;

#[derive(Clone, Message)]
#[rtype(result = "FullWorldData")]
pub struct GetWorld(pub String);
