use specs::{Component, VecStorage};

#[derive(Default)]
pub struct Id(pub usize);

impl Id {
    pub fn new(id: usize) -> Self {
        Self(id)
    }
}

impl Component for Id {
    type Storage = VecStorage<Self>;
}
