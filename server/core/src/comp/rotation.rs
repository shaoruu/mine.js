use specs::{Component, VecStorage};

use server_common::quaternion::Quaternion;

// consider making this more implicit
#[derive(Default)]
pub struct Rotation(pub Quaternion);

impl Rotation {
    pub fn new(qx: f32, qy: f32, qz: f32, qw: f32) -> Self {
        Self(Quaternion(qx, qy, qz, qw))
    }

    pub fn from_quaternion(quaternion: &Quaternion) -> Self {
        Self(quaternion.to_owned())
    }
}

impl Component for Rotation {
    type Storage = VecStorage<Self>;
}
