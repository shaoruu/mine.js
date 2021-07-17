use server_common::vec::Vec2;
use specs::{Component, VecStorage};

#[derive(Default)]
pub struct CurrChunk {
    pub val: Option<Vec2<i32>>,
    pub changed: bool,
}

impl CurrChunk {
    pub fn new() -> Self {
        Self {
            val: None,
            changed: false,
        }
    }

    pub fn diff(&self, chunk: &Vec2<i32>) -> bool {
        if let Some(val) = &self.val {
            val.0 != chunk.0 || val.1 != chunk.1
        } else {
            true
        }
    }
}

impl Component for CurrChunk {
    type Storage = VecStorage<Self>;
}
