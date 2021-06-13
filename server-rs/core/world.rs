use crate::libs::types::GeneratorType;

#[derive(Debug)]
pub struct World {
    pub time: i32,
    pub save: bool,
    pub name: String,
    pub tick_speed: i32,
    pub chunk_root: String,
    pub preload: i32,
    pub chunk_size: i32,
    pub dimension: i32,
    pub max_height: i32,
    pub render_radius: i32,
    pub max_light_level: i32,
    pub max_loaded_chunks: i32,
    pub generation: GeneratorType,
    pub description: String,
}
