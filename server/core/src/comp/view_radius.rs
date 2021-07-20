use specs::{Component, VecStorage};

#[derive(Default)]
pub struct ViewRadius(pub i16);

impl ViewRadius {
    pub fn new(r: i16) -> Self {
        Self(r)
    }
}

impl Component for ViewRadius {
    type Storage = VecStorage<Self>;
}
