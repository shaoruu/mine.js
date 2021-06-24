use serde::{Deserialize, Serialize};

use actix::prelude::*;

use crate::libs::types::{Coords2, Coords3, Quaternion};

use super::models::{self, messages};

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
    pub client_name: Option<String>,
    pub client_addr: Recipient<Message>,
    pub render_radius: i16,
}

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct LeaveWorld {
    pub world_name: String,
    pub client_id: usize,
}

/* -------------------------------------------------------------------------- */
/*                             Game Play Messages                             */
/* -------------------------------------------------------------------------- */
#[derive(Clone, Message, Default)]
#[rtype(result = "()")]
pub struct PlayerUpdate {
    pub world_name: String,
    pub client_id: usize,

    // Client attributes below
    pub name: Option<String>,
    pub position: Option<Coords3<f32>>,
    pub rotation: Option<Quaternion>,
    pub chunk: Option<Coords2<i32>>,
}

#[derive(Clone, Message, Default)]
#[rtype(result = "()")]
pub struct ChatMessage {
    pub world_name: String,
    pub message: messages::ChatMessage,
}

#[derive(Clone, Message, Default)]
#[rtype(result = "()")]
pub struct ConfigWorld {
    pub world_name: String,
    pub time: Option<f64>,
    pub tick_speed: Option<f64>,
    pub json: serde_json::Value,
}

#[derive(Clone, Message, Default)]
#[rtype(result = "()")]
pub struct UpdateVoxel {
    pub world_name: String,
    pub vx: i32,
    pub vy: i32,
    pub vz: i32,
    pub id: u32,
}

#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct SendMessage {
    // World name
    pub world_name: String,
    // id of client session
    pub client_id: usize,
    // Peer message
    pub content: models::messages::Message,
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

#[derive(MessageResponse, Deserialize, Serialize)]
pub struct WorldData {
    pub name: String,
    pub time: f32,
    pub generation: String,
    pub description: String,
    pub players: usize,
}

#[derive(Clone, Message)]
#[rtype(result = "Vec<WorldData>")]
pub struct ListWorlds;

#[derive(Clone, Message)]
#[rtype(result = "WorldData")]
pub struct GetWorld(pub String);
