use std::{
    collections::{HashMap, VecDeque},
    usize,
};

use actix::Recipient;
use specs::Entity;

use super::super::network::{message, models::messages};

use server_common::vec::Vec2;

pub type PlayerUpdates = HashMap<usize, messages::Peer>;

#[derive(Debug)]
pub struct Player {
    pub entity: Entity,
    pub name: Option<String>,
    pub addr: Recipient<message::Message>,
    pub requested_chunks: VecDeque<Vec2<i32>>,
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
