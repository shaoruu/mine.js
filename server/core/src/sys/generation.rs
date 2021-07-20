use specs::{ReadStorage, System, WriteExpect, WriteStorage};

use crate::{
    comp::{curr_chunk::CurrChunk, view_radius::ViewRadius},
    engine::chunks::Chunks,
};

pub struct GenerationSystem;

impl<'a> System<'a> for GenerationSystem {
    type SystemData = (
        WriteExpect<'a, Chunks>,
        ReadStorage<'a, ViewRadius>,
        WriteStorage<'a, CurrChunk>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (mut chunks, radiuses, mut curr_chunks) = data;

        for (radius, curr_chunk) in (&radiuses, &mut curr_chunks).join() {
            if let Some(coords) = &curr_chunk.val {
                if curr_chunk.changed {
                    chunks.generate(coords, radius.0, false);
                    curr_chunk.changed = false;
                }
            }
        }
    }
}
