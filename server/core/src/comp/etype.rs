use specs::{Component, VecStorage};

#[derive(Default, Component)]
#[storage(VecStorage)]
pub struct EType(pub String);

impl EType {
    pub fn new(val: &str) -> Self {
        Self(val.to_owned())
    }
}
