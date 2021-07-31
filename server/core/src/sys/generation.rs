use specs::{ReadExpect, ReadStorage, System, WriteExpect, WriteStorage};

use crate::{
    comp::{curr_chunk::CurrChunk, id::Id, view_radius::ViewRadius},
    engine::{chunks::Chunks, clock::Clock},
};

pub struct GenerationSystem;

impl<'a> System<'a> for GenerationSystem {
    #[allow(clippy::type_complexity)]
    type SystemData = (
        WriteExpect<'a, Chunks>,
        ReadStorage<'a, Id>,
        ReadStorage<'a, ViewRadius>,
        WriteStorage<'a, CurrChunk>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (mut chunks, ids, radiuses, mut curr_chunks) = data;
        let chunk_size = chunks.config.chunk_size;

        for (radius, curr_chunk, _) in (&radiuses, &mut curr_chunks, &ids).join() {
            if let Some(coords) = &curr_chunk.val {
                if curr_chunk.changed {
                    let r = (radius.0 as f32 / chunk_size as f32).ceil() as i16;
                    chunks.generate(coords, r, false);
                    curr_chunk.changed = false;
                }
            }
        }
    }
}
