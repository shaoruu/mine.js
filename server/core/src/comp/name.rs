use specs::{Component, VecStorage};

#[derive(Default)]
pub struct Name(pub Option<String>);

impl Name {
    pub fn new(name: &Option<String>) -> Self {
        Self(name.to_owned())
    }
}

impl Component for Name {
    type Storage = VecStorage<Self>;
}
