use specs::{Component, VecStorage};

use crate::libs::rigidbody::RigidBody;

pub struct Phys {
    pub body: RigidBody,
}

impl Component for Phys {
    type Storage = VecStorage<Self>;
}
