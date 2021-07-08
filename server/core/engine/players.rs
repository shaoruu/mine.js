use std::collections::{HashMap, VecDeque};

use actix::Recipient;

use crate::{
    core::network::{message, models::messages},
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

pub trait BroadcastExt {
    fn broadcast(&mut self, msg: &messages::Message, exclude: Vec<usize>);
}

impl BroadcastExt for Players {
    fn broadcast(&mut self, msg: &messages::Message, exclude: Vec<usize>) {
        let mut resting_players = vec![];

        for (id, player) in self.iter() {
            if exclude.contains(id) {
                continue;
            }

            if player
                .addr
                .do_send(message::Message(msg.to_owned()))
                .is_err()
            {
                resting_players.push(*id);
            }
        }

        resting_players.iter().for_each(|id| {
            self.remove(id);
        });
    }
}
