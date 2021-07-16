use server_common::quaternion::Quaternion;
use specs::{Component, VecStorage};

// consider making this more implicit
#[derive(Default)]
pub struct Rotation {
    pub val: Quaternion,
}

impl Rotation {
    pub fn new(qx: f32, qy: f32, qz: f32, qw: f32) -> Self {
        Self {
            val: Quaternion(qx, qy, qz, qw),
        }
    }
}

impl Component for Rotation {
    type Storage = VecStorage<Self>;
}
