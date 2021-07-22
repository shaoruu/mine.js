use specs::{Component, VecStorage};

#[derive(Default, Component)]
#[storage(VecStorage)]
pub struct Id(pub usize);

impl Id {
    pub fn new(id: usize) -> Self {
        Self(id)
    }
}
