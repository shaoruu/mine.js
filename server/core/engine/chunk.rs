use std::collections::HashSet;

use crate::{
    core::{
        gen::lights::{LightColor, Lights},
        network::models::ChunkProtocol,
    },
    libs::{
        ndarray::{ndarray, Ndarray},
        types::{Coords2, Coords3, MeshType},
    },
    utils::convert,
};

use super::super::constants::DATA_PADDING;

use super::chunks::MeshLevel;

#[derive(Debug, Clone)]
pub struct Meshes {
    pub sub_chunk: i32,
    pub opaque: Option<MeshType>,
    pub transparent: Option<MeshType>,
}

#[derive(Clone, Debug)]
pub struct Chunk {
    pub name: String,

    pub coords: Coords2<i32>,

    voxels: Ndarray<u32>,
    lights: Ndarray<u32>,
    height_map: Ndarray<i32>,

    pub min: Coords3<i32>,
    pub max: Coords3<i32>,
    pub min_inner: Coords3<i32>,
    pub max_inner: Coords3<i32>,

    pub needs_saving: bool,
    pub needs_propagation: bool,
    pub needs_terrain: bool,
    pub needs_decoration: bool,

    pub is_empty: bool,
    pub is_dirty: bool,
    pub dirty_levels: HashSet<u32>,

    pub size: usize,
    pub dimension: usize,
    pub max_height: usize,

    pub meshes: Vec<Meshes>,
}

impl Chunk {
    pub fn new(coords: Coords2<i32>, size: usize, max_height: usize, dimension: usize) -> Self {
        let Coords2(cx, cz) = coords;

        let name = convert::get_chunk_name(cx, cz);

        let voxels = ndarray(
            vec![size + DATA_PADDING * 2, max_height, size + DATA_PADDING * 2],
            0,
        );
        let lights = ndarray(
            vec![size + DATA_PADDING * 2, max_height, size + DATA_PADDING * 2],
            0,
        );
        let height_map = ndarray(vec![size + DATA_PADDING * 2, size + DATA_PADDING * 2], 0);

        let coords3 = Coords3(cx, 0, cz);

        let paddings = Coords3(DATA_PADDING as i32, 0, DATA_PADDING as i32);

        let min_inner = coords3.scale(size as i32);
        let min = min_inner.sub(&paddings);
        let max_inner = coords3
            .add(&Coords3(1, 0, 1))
            .scale(size as i32)
            .add(&Coords3(0, max_height as i32, 0));
        let max = max_inner.add(&paddings);

        Self {
            name,

            coords,
            voxels,
            lights,
            height_map,

            min,
            max,
            min_inner,
            max_inner,

            needs_saving: false,
            needs_propagation: true,
            needs_terrain: true,
            needs_decoration: true,

            is_empty: false,
            is_dirty: true,
            dirty_levels: HashSet::new(),

            size,
            max_height,
            dimension,

            meshes: Vec::new(),
        }
    }

    #[inline]
    pub fn get_voxel(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        if !self.contains(vx, vy, vz) {
            return 0;
        }

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.voxels[&[lx as usize, ly as usize, lz as usize]]
    }

    #[inline]
    pub fn set_voxel(&mut self, vx: i32, vy: i32, vz: i32, id: u32) {
        assert!(self.contains(vx, vy, vz,));

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.voxels[&[lx as usize, ly as usize, lz as usize]] = id;
    }

    #[inline]
    pub fn get_red_light(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        if !self.contains(vx, vy, vz) {
            return 0;
        }

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.get_local_red_light(lx as usize, ly as usize, lz as usize)
    }

    #[inline]
    pub fn set_red_light(&mut self, vx: i32, vy: i32, vz: i32, level: u32) {
        assert!(self.contains(vx, vy, vz,));

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.set_local_red_light(lx as usize, ly as usize, lz as usize, level);
    }

    #[inline]
    pub fn get_blue_light(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        if !self.contains(vx, vy, vz) {
            return 0;
        }

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.get_local_blue_light(lx as usize, ly as usize, lz as usize)
    }

    #[inline]
    pub fn set_blue_light(&mut self, vx: i32, vy: i32, vz: i32, level: u32) {
        assert!(self.contains(vx, vy, vz,));

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.set_local_blue_light(lx as usize, ly as usize, lz as usize, level);
    }

    #[inline]
    pub fn get_green_light(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        if !self.contains(vx, vy, vz) {
            return 0;
        }

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.get_local_green_light(lx as usize, ly as usize, lz as usize)
    }

    #[inline]
    pub fn set_green_light(&mut self, vx: i32, vy: i32, vz: i32, level: u32) {
        assert!(self.contains(vx, vy, vz,));

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.set_local_green_light(lx as usize, ly as usize, lz as usize, level);
    }

    #[inline]
    pub fn get_torch_light(&self, vx: i32, vy: i32, vz: i32, color: &LightColor) -> u32 {
        match color {
            LightColor::Red => self.get_red_light(vx, vy, vz),
            LightColor::Green => self.get_green_light(vx, vy, vz),
            LightColor::Blue => self.get_blue_light(vx, vy, vz),
            LightColor::None => panic!("Getting light of None"),
        }
    }

    #[inline]
    pub fn set_torch_light(&mut self, vx: i32, vy: i32, vz: i32, level: u32, color: &LightColor) {
        match color {
            LightColor::Red => self.set_red_light(vx, vy, vz, level),
            LightColor::Green => self.set_green_light(vx, vy, vz, level),
            LightColor::Blue => self.set_blue_light(vx, vy, vz, level),
            LightColor::None => panic!("Setting light of None"),
        }
    }

    #[inline]
    pub fn get_sunlight(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        if !self.contains(vx, vy, vz) {
            return 0;
        }

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.get_local_sunlight(lx as usize, ly as usize, lz as usize)
    }

    #[inline]
    pub fn set_sunlight(&mut self, vx: i32, vy: i32, vz: i32, level: u32) {
        assert!(self.contains(vx, vy, vz,));

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.set_local_sunlight(lx as usize, ly as usize, lz as usize, level)
    }

    #[inline]
    pub fn get_max_height(&self, vx: i32, vz: i32) -> i32 {
        if !self.contains(vx, 0, vz) {
            return self.max_height as i32;
        }

        let Coords3(lx, _, lz) = self.to_local(vx, 0, vz);
        self.height_map[&[lx as usize, lz as usize]]
    }

    #[inline]
    pub fn set_max_height(&mut self, vx: i32, vz: i32, height: i32) {
        assert!(self.contains(vx, 0, vz,));

        let Coords3(lx, _, lz) = self.to_local(vx, 0, vz);
        self.height_map[&[lx as usize, lz as usize]] = height;
    }

    #[inline]
    pub fn set_lights(&mut self, data: Ndarray<u32>) {
        self.lights = data;
    }

    pub fn calc_dirty_levels(&mut self, vy: i32, max_height: u32, sub_chunks: u32) {
        let vy = vy as u32;
        let unit = max_height / sub_chunks;
        let level = vy / unit;

        self.dirty_levels.insert(level);
        if vy % sub_chunks == 0 && level >= 1 {
            self.dirty_levels.insert(level - 1);
        } else if vy % sub_chunks == sub_chunks - 1 && level < sub_chunks - 1 {
            self.dirty_levels.insert(level + 1);
        }
    }

    #[allow(dead_code)]
    pub fn load(&mut self) {
        todo!()
    }

    #[allow(dead_code)]
    pub fn save(&mut self) {
        todo!()
    }

    pub fn get_protocol(&self, needs_voxels: bool, mesh: MeshLevel) -> ChunkProtocol {
        // TODO: clone? idk
        ChunkProtocol {
            x: self.coords.0,
            z: self.coords.1,
            meshes: match mesh {
                MeshLevel::All => self.meshes.to_owned(),
                MeshLevel::Levels(ls) => ls
                    .iter()
                    .map(|&l| self.meshes[l as usize].to_owned())
                    .collect(),
            },
            voxels: if needs_voxels {
                Some(self.voxels.to_owned())
            } else {
                None
            },
            lights: if needs_voxels {
                Some(self.lights.to_owned())
            } else {
                None
            },
        }
    }

    #[inline]
    fn get_local_red_light(&self, lx: usize, ly: usize, lz: usize) -> u32 {
        Lights::extract_red_light(self.lights[&[lx, ly, lz]])
    }

    #[inline]
    fn set_local_red_light(&mut self, lx: usize, ly: usize, lz: usize, level: u32) {
        self.lights[&[lx, ly, lz]] = Lights::insert_red_light(self.lights[&[lx, ly, lz]], level);
    }

    #[inline]
    fn get_local_green_light(&self, lx: usize, ly: usize, lz: usize) -> u32 {
        Lights::extract_green_light(self.lights[&[lx, ly, lz]])
    }

    #[inline]
    fn set_local_green_light(&mut self, lx: usize, ly: usize, lz: usize, level: u32) {
        self.lights[&[lx, ly, lz]] = Lights::insert_green_light(self.lights[&[lx, ly, lz]], level);
    }

    #[inline]
    fn get_local_blue_light(&self, lx: usize, ly: usize, lz: usize) -> u32 {
        Lights::extract_blue_light(self.lights[&[lx, ly, lz]])
    }

    #[inline]
    fn set_local_blue_light(&mut self, lx: usize, ly: usize, lz: usize, level: u32) {
        self.lights[&[lx, ly, lz]] = Lights::insert_blue_light(self.lights[&[lx, ly, lz]], level);
    }

    #[inline]
    fn get_local_sunlight(&self, lx: usize, ly: usize, lz: usize) -> u32 {
        Lights::extract_sunlight(self.lights[&[lx, ly, lz]])
    }

    #[inline]
    fn set_local_sunlight(&mut self, lx: usize, ly: usize, lz: usize, level: u32) {
        self.lights[&[lx, ly, lz]] = Lights::insert_sunlight(self.lights[&[lx, ly, lz]], level);
    }

    #[inline]
    fn to_local(&self, vx: i32, vy: i32, vz: i32) -> Coords3<i32> {
        Coords3(vx, vy, vz).sub(&self.min)
    }

    #[inline]
    fn contains(&self, vx: i32, vy: i32, vz: i32) -> bool {
        let size = self.size as i32;
        let max_height = self.max_height as i32;

        let Coords3(lx, ly, lz) = self.to_local(vx, vy, vz);

        lx >= 0
            && lx < size + DATA_PADDING as i32 * 2
            && ly >= 0
            && ly < max_height
            && lz >= 0
            && lz < size + DATA_PADDING as i32 * 2
    }
}
