use specs::{Component, VecStorage};

/// Short for Entity Type, tagged on non-player entities
#[derive(Default, Component)]
#[storage(VecStorage)]
pub struct EType(pub String);

impl EType {
    pub fn new(val: &str) -> Self {
        Self(val.to_owned())
    }
}
