use num::cast;

use std::collections::HashMap;

#[derive(Debug, PartialEq)]
pub struct Coords2<T>(pub T, pub T);

impl<T: Copy + 'static> Coords2<T> {
    pub fn from<U: cast::AsPrimitive<T>>(other: &Coords2<U>) -> Coords2<T> {
        Coords2(other.0.as_(), other.1.as_())
    }
}

#[derive(Debug, PartialEq)]
pub struct Coords3<T>(pub T, pub T, pub T);

impl<T: Copy + 'static> Coords3<T> {
    pub fn from<U: cast::AsPrimitive<T>>(other: &Coords3<U>) -> Coords3<T> {
        Coords3(other.0.as_(), other.1.as_(), other.2.as_())
    }
}

pub struct Quaternion(pub f32, pub f32, pub f32, pub f32);

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

#[derive(Debug)]
pub enum GeneratorType {
    FLAT,
    HILLY,
}

impl GeneratorType {
    pub fn parse(name: &str) -> Option<Self> {
        let lower = name.to_lowercase();
        if lower == "flat" {
            return Some(Self::FLAT);
        } else if lower == "hilly" {
            return Some(Self::HILLY);
        }
        None
    }
}
