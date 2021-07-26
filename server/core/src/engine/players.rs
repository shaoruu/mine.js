use std::{
    collections::{HashMap, VecDeque},
    usize,
};

use actix::Recipient;
use specs::Entity;

use super::super::network::{message, models::messages};

use server_common::vec::Vec2;

pub type PlayerUpdates = HashMap<usize, messages::Peer>;

/// Single unit of a player
///
/// Stores the broker address to communicate with server
#[derive(Debug)]
pub struct Player {
    pub entity: Entity,
    pub name: Option<String>,
    pub addr: Recipient<message::Message>,
    pub requested_chunks: VecDeque<Vec2<i32>>,
}

/// Resource to store all server-side players in a HashMap
pub type Players = HashMap<usize, Player>;

pub trait BroadcastExt {
    fn broadcast(
        &mut self,
        msg: &messages::Message,
        include: Vec<usize>,
        exclude: Vec<usize>,
        sender: Option<usize>,
    ) -> Vec<Player>;
}

impl BroadcastExt for Players {
    /// Broadcast a message to all players. Exclude will be used if include is empty.
    ///
    /// Returns a list of inactive/disconnected players
    fn broadcast(
        &mut self,
        msg: &messages::Message,
        include: Vec<usize>,
        exclude: Vec<usize>,
        sender: Option<usize>,
    ) -> Vec<Player> {
        let mut resting_players = vec![];

        if let Some(sender) = sender {
            if sender != 0 && !self.contains_key(&sender) {
                return vec![];
            }
        }

        if !include.is_empty() {
            for id in include.iter() {
                if let Some(player) = self.get(id) {
                    if player
                        .addr
                        .do_send(message::Message(msg.to_owned()))
                        .is_err()
                    {
                        resting_players.push(*id);
                    }
                }
            }
        } else {
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
        }

        let mut inactives = vec![];

        resting_players.iter().for_each(|id| {
            if let Some(player) = self.remove(id) {
                inactives.push(player);
            }
        });

        inactives
    }
}
