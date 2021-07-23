use specs::{Component, VecStorage};

use server_common::vec::Vec3;

/// A component for entities to walk along a path towards a target.
#[derive(Default, Component)]
#[storage(VecStorage)]
pub struct WalkTowards(pub Vec3<f32>);
