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

        for (sender, msg, exclude) in messages.iter() {
            players.broadcast(sender, msg, exclude.to_owned());
        }

        messages.clear();
    }
}
