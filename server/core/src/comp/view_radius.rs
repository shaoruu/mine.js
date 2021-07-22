use specs::{Component, VecStorage};

#[derive(Default, Component)]
#[storage(VecStorage)]
pub struct ViewRadius(pub i16);

impl ViewRadius {
    pub fn new(r: i16) -> Self {
        Self(r)
    }
}
