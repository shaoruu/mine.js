use specs::{Component, VecStorage};

#[derive(Default)]
pub struct ViewRadius {
    pub val: i16,
}

impl ViewRadius {
    pub fn new(id: i16) -> Self {
        Self { val: id }
    }
}

impl Component for ViewRadius {
    type Storage = VecStorage<Self>;
}
