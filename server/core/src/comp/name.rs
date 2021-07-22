use specs::{Component, VecStorage};

#[derive(Default, Component)]
#[storage(VecStorage)]
pub struct Name(pub Option<String>);

impl Name {
    pub fn new(name: &Option<String>) -> Self {
        Self(name.to_owned())
    }
}
