use std::collections::HashMap;

#[derive(Debug, PartialEq)]
pub struct Coords2(pub i32, pub i32);

#[derive(Debug, PartialEq)]
pub struct FCoords2(pub f32, pub f32);

#[derive(Debug, PartialEq)]
pub struct Coords3(pub i32, pub i32, pub i32);

impl Coords3 {
    pub fn from_fcoords(f_coords: &FCoords3) -> Self {
        Coords3(f_coords.0 as i32, f_coords.1 as i32, f_coords.2 as i32)
    }

    pub fn to_fcoords(&self) -> FCoords3 {
        FCoords3(self.0 as f32, self.1 as f32, self.2 as f32)
    }
}

#[derive(Debug, PartialEq)]
pub struct FCoords3(pub f32, pub f32, pub f32);

#[derive(Debug)]
pub struct UV {
    pub start_u: f32,
    pub end_u: f32,
    pub start_v: f32,
    pub end_v: f32,
}

#[derive(Debug)]
pub struct Block {
    pub name: String,
    pub is_block: bool,
    pub is_empty: bool,
    pub is_fluid: bool,
    pub is_light: bool,
    pub is_plant: bool,
    pub is_solid: bool,
    pub is_transparent: bool,
    pub light_level: i64,
    pub textures: HashMap<String, String>,
    pub transparent_standalone: bool,
}

pub enum GeneratorType {
    FLAT,
    HILLY,
}
