use actix::prelude::*;

use crate::libs::types::Coords2;

use super::{
    models::{self, ChunkProtocol},
    world::WorldMetrics,
};

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
    pub metrics: WorldMetrics,
}

#[derive(Clone, Message)]
#[rtype(result = "JoinResult")]
pub struct JoinWorld {
    pub world_name: String,
    pub client_name: Option<String>,
    pub client: Recipient<Message>,
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
#[derive(Clone, Message)]
#[rtype(result = "()")]
pub struct Generate {
    pub world_name: String,
    pub coords: Coords2<i32>,
    pub render_radius: i16,
}

#[derive(MessageResponse)]
pub struct ChunkRequestResult {
    pub protocol: Option<ChunkProtocol>,
}

#[derive(Clone, Message)]
#[rtype(result = "ChunkRequestResult")]
pub struct ChunkRequest {
    pub world_name: String,
    pub needs_voxels: bool,
    pub coords: Coords2<i32>,
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
#[rtype(result = "Vec<String>")]
pub struct ListWorlds;
