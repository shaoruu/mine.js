use std::collections::{HashMap, VecDeque};

use actix::Recipient;

use crate::{
    core::network::message,
    libs::types::{Quaternion, Vec2, Vec3},
};

#[derive(Debug)]
pub struct Player {
    pub name: Option<String>,
    pub addr: Recipient<message::Message>,
    pub position: Vec3<f32>,
    pub rotation: Quaternion,
    pub current_chunk: Option<Vec2<i32>>,
    pub requested_chunks: VecDeque<Vec2<i32>>,
    pub render_radius: i16,
}

pub type Players = HashMap<usize, Player>;
