use specs::{Component, VecStorage};

#[derive(Default)]
pub struct Id {
    pub val: usize,
}

impl Id {
    pub fn new(id: usize) -> Self {
        Self { val: id }
    }
}

impl Component for Id {
    type Storage = VecStorage<Self>;
}
