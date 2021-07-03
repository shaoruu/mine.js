#![allow(dead_code)]

use num::{cast, Float, Num};

use std::{
    collections::HashMap,
    ops::{Index, IndexMut},
};

pub type TypeMap = HashMap<String, u32>;

#[derive(Debug, Eq, PartialEq, Clone, Default, Hash)]
pub struct Coords2<T>(pub T, pub T);

impl<T: Copy + 'static> Coords2<T> {
    pub fn from<U: cast::AsPrimitive<T>>(other: &Coords2<U>) -> Coords2<T> {
        Coords2(other.0.as_(), other.1.as_())
    }
}

#[derive(Debug, Eq, PartialEq, Clone, Default, Hash)]
pub struct Coords3<T>(pub T, pub T, pub T);

impl<T: Copy + 'static> Coords3<T> {
    pub fn from<U: cast::AsPrimitive<T>>(other: &Coords3<U>) -> Coords3<T> {
        Coords3(other.0.as_(), other.1.as_(), other.2.as_())
    }
}

impl<T> Coords3<T>
where
    T: Num + Copy,
{
    pub fn add(&self, other: &Self) -> Self {
        Coords3(self.0 + other.0, self.1 + other.1, self.2 + other.2)
    }

    pub fn sub(&self, other: &Self) -> Self {
        Coords3(self.0 - other.0, self.1 - other.1, self.2 - other.2)
    }

    pub fn scale(&self, scale: T) -> Self {
        Coords3(self.0 * scale, self.1 * scale, self.2 * scale)
    }
}

impl<T> Coords3<T>
where
    T: Float,
{
    pub fn max(&self, other: &Self) -> Self {
        Coords3(
            Float::max(self.0, other.0),
            Float::max(self.1, other.1),
            Float::max(self.2, other.2),
        )
    }

    pub fn min(&self, other: &Self) -> Self {
        Coords3(
            Float::min(self.0, other.0),
            Float::min(self.1, other.1),
            Float::min(self.2, other.2),
        )
    }
}

impl<T: Num + Clone> Index<usize> for Coords3<T> {
    type Output = T;

    fn index(&self, index: usize) -> &Self::Output {
        if index == 0 {
            &self.0
        } else if index == 1 {
            &self.1
        } else if index == 2 {
            &self.2
        } else {
            panic!("Index out of bounds for accessing Coords3.");
        }
    }
}

impl<T: Num + Clone> IndexMut<usize> for Coords3<T> {
    fn index_mut(&mut self, index: usize) -> &mut Self::Output {
        if index == 0 {
            &mut self.0
        } else if index == 1 {
            &mut self.1
        } else if index == 2 {
            &mut self.2
        } else {
            panic!("Index out of bounds for accessing Coords3.");
        }
    }
}

#[derive(Debug, PartialEq, Default, Clone)]
pub struct Quaternion(pub f32, pub f32, pub f32, pub f32);

#[derive(Debug, Clone)]
pub struct UV {
    pub start_u: f32,
    pub end_u: f32,
    pub start_v: f32,
    pub end_v: f32,
}

#[derive(Debug, Clone)]
pub struct Block {
    pub name: String,
    pub is_block: bool,
    pub is_empty: bool,
    pub is_fluid: bool,
    pub is_light: bool,
    pub is_plant: bool,
    pub is_solid: bool,
    pub is_transparent: bool,
    pub red_light_level: u32,
    pub green_light_level: u32,
    pub blue_light_level: u32,
    pub is_plantable: bool,
    pub textures: HashMap<String, String>,
    pub transparent_standalone: bool,
}

#[derive(Debug, Clone)]
pub enum GenerationType {
    FLAT,
    HILLY,
}

impl GenerationType {
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

#[derive(Debug, Clone)]
pub struct MeshType {
    pub positions: Vec<f32>,
    pub indices: Vec<i32>,
    pub uvs: Vec<f32>,
    pub aos: Vec<i32>,
    pub lights: Vec<i32>,
}

pub type GetVoxel = dyn Fn(i32, i32, i32) -> u32;
