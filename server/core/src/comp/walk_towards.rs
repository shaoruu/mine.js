use server_common::vec::Vec3;
use specs::{Component, VecStorage};

/// A component for entities to walk along a path towards a target
///
/// Stores a vector of the next target node to walk towards.
#[derive(Default, Component)]
#[storage(VecStorage)]
pub struct WalkTowards(pub Option<Vec<Vec3<i32>>>, pub usize);
