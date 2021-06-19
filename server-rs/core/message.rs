use actix::prelude::*;

use crate::libs::types::Coords2;

use super::{
    models::{self, ChunkProtocol},
    world::WorldMetrics,
};

#[derive(Message)]
#[rtype(result = "()")]
pub struct Message(pub String);

#[derive(MessageResponse)]
pub struct ConnectionResult {
    pub id: usize,
    pub metrics: WorldMetrics,
}

#[derive(Message)]
#[rtype(result = "ConnectionResult")]
pub struct Connect {
    pub world_name: String,
    pub addr: Recipient<Message>,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub id: usize,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Generate {
    pub world: String,
    pub coords: Coords2<i32>,
    pub render_radius: i16,
}

#[derive(MessageResponse)]
pub struct ChunkRequestResult {
    pub protocol: Option<ChunkProtocol>,
}

#[derive(Message)]
#[rtype(result = "ChunkRequestResult")]
pub struct ChunkRequest {
    pub world: String,
    pub needs_voxels: bool,
    pub coords: Coords2<i32>,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct ClientMessage {
    // id of client session
    pub id: usize,
    // Peer message
    pub msg: models::messages::Message,
    // Room name
    pub world: String,
}

// list of available rooms
pub struct ListWorlds;

impl actix::Message for ListWorlds {
    type Result = Vec<String>;
}
