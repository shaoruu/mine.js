use ndarray::{Array2, Array3};

use crate::{
    libs::types::{Coords2, Coords3},
    utils::convert,
};

#[derive(Debug)]
pub struct Chunk {
    pub name: String,

    pub coords: Coords2<i32>,

    pub voxels: Array3<u8>,
    pub lights: Array3<u8>,
    pub height_map: Array2<i32>,

    pub min: Coords3<i32>,
    pub max: Coords3<i32>,

    pub needs_saving: bool,
    pub needs_propagation: bool,
    pub needs_terrain: bool,
    pub needs_decoration: bool,

    pub is_empty: bool,
    pub is_dirty: bool,

    pub top_y: i32,

    pub size: usize,
    pub max_height: usize,
}

impl Chunk {
    pub fn new(coords: Coords2<i32>, size: usize, max_height: usize) -> Self {
        let Coords2(cx, cz) = coords;

        let name = convert::get_chunk_name(&coords);

        let voxels: Array3<u8> = Array3::zeros((size, max_height, size));
        let lights: Array3<u8> = Array3::zeros((size, max_height, size));
        let height_map: Array2<i32> = Array2::zeros((size, size));

        let coords3 = Coords3(cx, 0, cz);

        let min = coords3.clone().scale(size as i32);
        let max = coords3
            .clone()
            .add(&Coords3(1, 0, 1))
            .scale(size as i32)
            .add(&Coords3(0, max_height as i32, 0));

        Self {
            name,

            coords,
            voxels,
            lights,
            height_map,
            min,
            max,

            needs_saving: false,
            needs_propagation: true,
            needs_terrain: true,
            needs_decoration: true,

            is_empty: true,
            is_dirty: true,

            top_y: max_height as i32,

            size,
            max_height,
        }
    }

    pub fn get_voxel(&self, vx: i32, vy: i32, vz: i32) -> u8 {
        if !self.contains(vx, vy, vz, 0) {
            return 0;
        }

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.voxels[[lx as usize, ly as usize, lz as usize]]
    }

    pub fn set_voxel(&mut self, vx: i32, vy: i32, vz: i32, id: u8) {
        assert!(self.contains(vx, vy, vz, 0));

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.voxels[[lx as usize, ly as usize, lz as usize]] = id;
    }

    pub fn get_torch_light(&self, vx: i32, vy: i32, vz: i32) -> u8 {
        if !self.contains(vx, vy, vz, 0) {
            return 0;
        }

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.get_local_torch_light(lx as usize, ly as usize, lz as usize)
    }

    pub fn set_torch_light(&mut self, vx: i32, vy: i32, vz: i32, level: u8) {
        assert!(self.contains(vx, vy, vz, 0));

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.set_local_torch_light(lx as usize, ly as usize, lz as usize, level)
    }

    pub fn get_sunlight(&self, vx: i32, vy: i32, vz: i32) -> u8 {
        if !self.contains(vx, vy, vz, 0) {
            return 0;
        }

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.get_local_sunlight(lx as usize, ly as usize, lz as usize)
    }

    pub fn set_sunlight(&mut self, vx: i32, vy: i32, vz: i32, level: u8) {
        assert!(self.contains(vx, vy, vz, 0));

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.set_local_sunlight(lx as usize, ly as usize, lz as usize, level)
    }

    pub fn get_max_height(&self, column: &Coords2<i32>) -> i32 {
        if !self.contains(column.0, 0, column.1, 0) {
            return self.max_height as i32;
        }

        let Coords3(lx, _, lz) = self.to_local(column.0, 0, column.1);
        self.height_map[[lx as usize, lz as usize]]
    }

    pub fn set_max_height(&mut self, column: &Coords2<i32>, height: i32) {
        assert!(self.contains(column.0, 0, column.1, 0));

        if height > self.top_y {
            self.top_y = height;
        }

        let Coords3(lx, _, lz) = self.to_local(column.0, 0, column.1);
        self.height_map[[lx as usize, lz as usize]] = height;
    }

    pub fn load() {
        todo!()
    }

    pub fn save() {
        todo!()
    }

    pub fn generate() {
        todo!()
    }

    pub fn decorate() {
        todo!()
    }

    pub fn generate_height_map() {
        todo!()
    }

    pub fn propagate() {
        todo!()
    }

    pub fn update() {
        todo!()
    }

    pub fn remesh() {
        todo!()
    }

    pub fn get_protocol() {
        todo!()
    }

    fn get_local_torch_light(&self, lx: usize, ly: usize, lz: usize) -> u8 {
        self.lights[[lx, ly, lz]] & 0xf
    }

    fn set_local_torch_light(&mut self, lx: usize, ly: usize, lz: usize, level: u8) {
        self.lights[[lx, ly, lz]] = (self.lights[[lx, ly, lz]] & 0xf0) | level;
    }

    fn get_local_sunlight(&self, lx: usize, ly: usize, lz: usize) -> u8 {
        (self.lights[[lx, ly, lz]] >> 4) & 0xf
    }

    fn set_local_sunlight(&mut self, lx: usize, ly: usize, lz: usize, level: u8) {
        self.lights[[lx, ly, lz]] = (self.lights[[lx, ly, lz]] & 0xf) | (level << 4);
    }

    fn to_local(&self, vx: i32, vy: i32, vz: i32) -> Coords3<i32> {
        Coords3(vx, vy, vz).sub(&self.min)
    }

    fn flood_light() {
        todo!()
    }

    fn remove_light() {
        todo!()
    }

    fn contains(&self, vx: i32, vy: i32, vz: i32, padding: i32) -> bool {
        let size = self.size as i32;
        let max_height = self.max_height as i32;

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);

        lx >= -padding
            && lx < size + padding
            && ly >= 0
            && ly < max_height
            && lz >= -padding
            && lz < size + padding
    }
}
