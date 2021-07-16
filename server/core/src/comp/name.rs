use specs::{Component, VecStorage};

#[derive(Default)]
pub struct Name {
    pub val: Option<String>,
}

impl Name {
    pub fn new(name: &Option<String>) -> Self {
        Self {
            val: name.to_owned(),
        }
    }
}

impl Component for Name {
    type Storage = VecStorage<Self>;
}
