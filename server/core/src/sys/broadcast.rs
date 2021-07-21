use specs::{System, WriteExpect};

use crate::engine::{
    players::{BroadcastExt, Players},
    world::MessagesQueue,
};

pub struct BroadcastSystem;

impl<'a> System<'a> for BroadcastSystem {
    type SystemData = (WriteExpect<'a, MessagesQueue>, WriteExpect<'a, Players>);

    fn run(&mut self, data: Self::SystemData) {
        let (mut messages, mut players) = data;

        for (msg, include, exclude, sender) in messages.iter() {
            // TODO: add spam detection?

            let include = if include.is_some() {
                include.clone().unwrap()
            } else {
                vec![]
            };

            let exclude = if exclude.is_some() {
                exclude.clone().unwrap()
            } else {
                vec![]
            };

            players.broadcast(
                msg,
                include.to_owned(),
                exclude.to_owned(),
                sender.to_owned(),
            );
        }

        messages.clear();
    }
}
