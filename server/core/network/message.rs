use serde::{Deserialize, Serialize};

use actix::prelude::*;

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

/// Whenever a protobuf message is received, player will send the message to server
#[derive(Clone, Message, Default)]
#[rtype(result = "()")]
pub struct PlayerMessage {
    pub world_name: String,
    pub client_id: usize,

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
