use byteorder::{ByteOrder, LittleEndian};

use libflate::zlib::{Decoder, Encoder};

use log::debug;
use serde::{Deserialize, Serialize};

use std::{
    collections::HashSet,
    fs::File,
    intrinsics::transmute,
    io::{Read, Write},
    path::PathBuf,
};

use crate::{
    core::{
        engine::world::WorldConfig,
        gen::lights::{LightColor, Lights},
        network::models::ChunkProtocol,
    },
    libs::{
        ndarray::{ndarray, Ndarray},
        types::{MeshType, Vec2, Vec3},
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

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChunkFileData {
    needs_propagation: bool,
    voxels: String,
    lights: String,
    height_map: String,
}

#[derive(Clone, Debug)]
pub struct Chunk {
    pub name: String,

    pub coords: Vec2<i32>,

    voxels: Ndarray<u32>,
    lights: Ndarray<u32>,
    height_map: Ndarray<u32>,

    pub min: Vec3<i32>,
    pub max: Vec3<i32>,
    pub min_inner: Vec3<i32>,
    pub max_inner: Vec3<i32>,

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

    pub file: String,
}

impl Chunk {
    pub fn new(coords: Vec2<i32>, config: &WorldConfig, folder: &PathBuf) -> Self {
        let Vec2(cx, cz) = coords;

        let &WorldConfig {
            chunk_size: size,
            dimension,
            max_height,
            save,
            ..
        } = config;

        let max_height = max_height as usize;

        let name = convert::get_chunk_name(cx, cz);

        let voxels = ndarray(
            vec![
                size + DATA_PADDING * 2,
                max_height as usize,
                size + DATA_PADDING * 2,
            ],
            0,
        );
        let lights = ndarray(
            vec![
                size + DATA_PADDING * 2,
                max_height as usize,
                size + DATA_PADDING * 2,
            ],
            0,
        );
        let height_map = ndarray(vec![size + DATA_PADDING * 2, size + DATA_PADDING * 2], 0);

        let coords3 = Vec3(cx, 0, cz);

        let paddings = Vec3(DATA_PADDING as i32, 0, DATA_PADDING as i32);

        let min_inner = coords3.scale(size as i32);
        let min = min_inner.sub(&paddings);
        let max_inner =
            coords3
                .add(&Vec3(1, 0, 1))
                .scale(size as i32)
                .add(&Vec3(0, max_height as i32, 0));
        let max = max_inner.add(&paddings);

        let mut path = folder.clone();
        let mut file_name = name.clone();
        file_name.push_str(".json");
        path.push(file_name.as_str());

        let mut new_chunk = Self {
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

            file: path.into_os_string().into_string().unwrap(),
        };

        if save {
            new_chunk.try_load();
        }

        new_chunk
    }

    /// try to access saved data file for chunk
    pub fn try_load(&mut self) {
        // open a file for reading

        if let Ok(chunk_data) = File::open(&self.file) {
            let data: ChunkFileData = serde_json::from_reader(chunk_data).unwrap();

            let ChunkFileData {
                needs_propagation,
                voxels,
                lights,
                height_map,
            } = data;

            self.needs_saving = false;
            self.needs_terrain = false;
            self.needs_decoration = false;
            self.needs_propagation = needs_propagation;

            let decode_base64 = |base: String| {
                let decoded = base64::decode(base).unwrap();
                let mut decoder = Decoder::new(&decoded[..]).unwrap();
                let mut buf = Vec::new();
                decoder.read_to_end(&mut buf).unwrap();
                let mut data = vec![0; buf.len() / 4];
                LittleEndian::read_u32_into(&buf, &mut data);
                data
            };

            self.lights.data = decode_base64(lights);
            self.voxels.data = decode_base64(voxels);
            self.height_map.data = decode_base64(height_map);
        }
    }

    pub fn save(&self) {
        let mut file = File::create(&self.file).expect("Could not create chunk file.");

        let to_base_64 = |data: &Vec<u32>| {
            let mut bytes = vec![0; data.len() * 4];
            LittleEndian::write_u32_into(data, &mut bytes);

            let mut encoder = Encoder::new(vec![]).unwrap();
            encoder.write_all(bytes.as_slice()).unwrap();
            let encoded = encoder.finish().into_result().unwrap();
            base64::encode(&encoded)
        };

        let data = ChunkFileData {
            needs_propagation: self.needs_propagation,
            lights: to_base_64(&self.lights.data),
            voxels: to_base_64(&self.voxels.data),
            height_map: to_base_64(&self.height_map.data),
        };

        let j = serde_json::to_string(&data).unwrap();

        file.write_all(j.as_bytes())
            .expect("Unable to write to chunk file.");
    }

    #[inline]
    pub fn get_voxel(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        if !self.contains(vx, vy, vz) {
            return 0;
        }

        let Vec3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.voxels[&[lx as usize, ly as usize, lz as usize]]
    }

    #[inline]
    pub fn set_voxel(&mut self, vx: i32, vy: i32, vz: i32, id: u32) {
        assert!(self.contains(vx, vy, vz,));

        let Vec3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.voxels[&[lx as usize, ly as usize, lz as usize]] = id;
    }

    #[inline]
    pub fn get_red_light(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        if !self.contains(vx, vy, vz) {
            return 0;
        }

        let Vec3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.get_local_red_light(lx as usize, ly as usize, lz as usize)
    }

    #[inline]
    pub fn set_red_light(&mut self, vx: i32, vy: i32, vz: i32, level: u32) {
        assert!(self.contains(vx, vy, vz,));

        let Vec3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.set_local_red_light(lx as usize, ly as usize, lz as usize, level);
    }

    #[inline]
    pub fn get_blue_light(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        if !self.contains(vx, vy, vz) {
            return 0;
        }

        let Vec3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.get_local_blue_light(lx as usize, ly as usize, lz as usize)
    }

    #[inline]
    pub fn set_blue_light(&mut self, vx: i32, vy: i32, vz: i32, level: u32) {
        assert!(self.contains(vx, vy, vz,));

        let Vec3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.set_local_blue_light(lx as usize, ly as usize, lz as usize, level);
    }

    #[inline]
    pub fn get_green_light(&self, vx: i32, vy: i32, vz: i32) -> u32 {
        if !self.contains(vx, vy, vz) {
            return 0;
        }

        let Vec3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.get_local_green_light(lx as usize, ly as usize, lz as usize)
    }

    #[inline]
    pub fn set_green_light(&mut self, vx: i32, vy: i32, vz: i32, level: u32) {
        assert!(self.contains(vx, vy, vz,));

        let Vec3(lx, ly, lz) = self.to_local(vx, vy, vz);
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

        let Vec3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.get_local_sunlight(lx as usize, ly as usize, lz as usize)
    }

    #[inline]
    pub fn set_sunlight(&mut self, vx: i32, vy: i32, vz: i32, level: u32) {
        assert!(self.contains(vx, vy, vz,));

        let Vec3(lx, ly, lz) = self.to_local(vx, vy, vz);
        self.set_local_sunlight(lx as usize, ly as usize, lz as usize, level)
    }

    #[inline]
    pub fn get_max_height(&self, vx: i32, vz: i32) -> u32 {
        if !self.contains(vx, 0, vz) {
            return self.max_height as u32;
        }

        let Vec3(lx, _, lz) = self.to_local(vx, 0, vz);
        self.height_map[&[lx as usize, lz as usize]]
    }

    #[inline]
    pub fn set_max_height(&mut self, vx: i32, vz: i32, height: u32) {
        assert!(self.contains(vx, 0, vz,));

        let Vec3(lx, _, lz) = self.to_local(vx, 0, vz);
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

    pub fn get_protocol(
        &self,
        needs_meshes: bool,
        needs_voxels: bool,
        needs_lights: bool,
        mesh: MeshLevel,
    ) -> ChunkProtocol {
        // TODO: clone? idk
        ChunkProtocol {
            x: self.coords.0,
            z: self.coords.1,
            meshes: if needs_meshes {
                Some(match mesh {
                    MeshLevel::All => self.meshes.to_owned(),
                    MeshLevel::Levels(ls) => ls
                        .iter()
                        .map(|&l| self.meshes[l as usize].to_owned())
                        .collect(),
                    _ => panic!("Mismatch of need"),
                })
            } else {
                None
            },
            voxels: if needs_voxels {
                Some(self.voxels.to_owned())
            } else {
                None
            },
            lights: if needs_lights {
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
    fn to_local(&self, vx: i32, vy: i32, vz: i32) -> Vec3<i32> {
        Vec3(vx, vy, vz).sub(&self.min)
    }

    #[inline]
    fn contains(&self, vx: i32, vy: i32, vz: i32) -> bool {
        let size = self.size as i32;
        let max_height = self.max_height as i32;

        let Vec3(lx, ly, lz) = self.to_local(vx, vy, vz);

        lx >= 0
            && lx < size + DATA_PADDING as i32 * 2
            && ly >= 0
            && ly < max_height
            && lz >= 0
            && lz < size + DATA_PADDING as i32 * 2
    }
}
