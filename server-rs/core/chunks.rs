// use rayon::prelude::*;
use std::collections::HashMap;

use crate::{
    libs::types::{Coords2, Coords3},
    utils::convert::{get_chunk_name, map_voxel_to_chunk},
};

use super::{chunk::Chunk, server::WsSession};

#[derive(Debug)]
pub struct Chunks {
    chunk_size: usize,
    max_height: usize,
    chunks: HashMap<String, Chunk>,
}

impl Chunks {
    pub fn new(chunk_size: usize, max_height: usize) -> Self {
        Chunks {
            chunk_size,
            max_height,
            chunks: HashMap::new(),
        }
    }

    pub fn all(&self) -> Vec<&Chunk> {
        self.chunks.values().collect()
    }

    pub fn raw(&mut self, coords: &Coords2<i32>) -> Option<&mut Chunk> {
        self.get_chunk_mut(coords)
    }

    pub fn get(&self, coords: &Coords2<i32>) -> Option<&Chunk> {
        let chunk = self.get_chunk(coords);
        let neighbors = self.neighbors(coords);

        // TODO: need to implement neighbors
        match chunk {
            None => None,
            Some(chunk) => {
                if chunk.needs_terrain
                    || chunk.needs_decoration
                    || neighbors.iter().any(|&c| c.is_none())
                    || neighbors.iter().any(|&c| c.unwrap().needs_decoration)
                {
                    return None;
                }
                Some(chunk)
            }
        }
    }

    pub fn set_voxel(&mut self, vx: i32, vy: i32, vz: i32, id: u8) {
        let size = self.chunk_size;
        let coords = map_voxel_to_chunk(&Coords3(vx, vy, vz), size);
        let chunk = self.raw(&coords);

        if let Some(chunk) = chunk {
            chunk.set_voxel(vx, vy, vz, id);
        }
    }

    pub fn preload(&mut self, width: i16) {
        self.load(Coords2(0, 0), width, false);
    }

    pub fn generate(&mut self, client: WsSession) {
        let current_chunk = client.current_chunk;
        let render_radius = client.render_radius;

        self.load(current_chunk, render_radius, false);
    }

    pub fn unload() {
        todo!();
    }

    fn load(&mut self, coords: Coords2<i32>, render_radius: i16, should_mesh: bool) {
        let Coords2(cx, cz) = coords;

        let mut to_generate: Vec<Chunk> = Vec::new();
        let mut to_decorate: Vec<Coords2<i32>> = Vec::new();

        let terrain_radius = render_radius + 4;
        let decorate_radius = render_radius;

        for x in -terrain_radius..=terrain_radius {
            for z in -terrain_radius..=terrain_radius {
                let dist = x * x + z * z;

                if dist >= terrain_radius * terrain_radius {
                    continue;
                }

                let coords = Coords2(cx + x as i32, cz + z as i32);
                let chunk = self.get_chunk(&coords);

                if chunk.is_none() {
                    let mut new_chunk =
                        Chunk::new(coords.to_owned(), self.chunk_size, self.max_height);

                    to_generate.push(new_chunk);
                }

                if dist <= decorate_radius * decorate_radius {
                    to_decorate.push(coords.to_owned());
                }
            }
        }

        for mut chunk in to_generate {
            chunk.generate();
            self.chunks.insert(chunk.name.to_owned(), chunk);
        }

        for coords in to_decorate.iter() {
            self.decorate_chunk(coords);
        }

        for coords in to_decorate.iter() {
            // ?
            self.get_chunk_mut(coords).unwrap().generate_height_map();
        }

        // for coords in to_generate {}

        // to_generate.par_iter().for_each(|gen_coords| {
        //     println!("{:?}", gen_coords);
        //     // self.test("generating");
        //     // TODO: generate these chunks in parallel
        // });

        // to_decorate.par_iter().for_each(|dec_coords| {
        //     println!("{:?}", dec_coords);
        //     // self.test("decorating");
        //     // TODO: decorate these chunks in parallel
        // });

        if should_mesh {
            // TODO: MESH?
        }
    }

    fn decorate_chunk(&mut self, coords: &Coords2<i32>) {
        let chunk = self
            .get_chunk_mut(&coords)
            .expect(format!("Chunk not found {:?}", coords).as_str());

        chunk.needs_decoration = false;

        let Coords3(min_x, min_y, min_z) = chunk.min;

        self.set_voxel(min_x, min_y, min_z, 1);
        self.set_voxel(min_x - 1, min_y, min_z - 1, 2);
    }

    fn make_chunk_height_map(&mut self, coords: &Coords2<i32>) {}

    fn neighbors(&self, Coords2(cx, cz): &Coords2<i32>) -> Vec<Option<&Chunk>> {
        let mut neighbors = Vec::new();

        for x in -1..=1 {
            for z in -1..1 {
                if x == 0 && z == 0 {
                    continue;
                }

                neighbors.push(self.get_chunk(&Coords2(cx + x, cz + z)))
            }
        }

        neighbors
    }

    fn get_chunk(&self, coords: &Coords2<i32>) -> Option<&Chunk> {
        let name = get_chunk_name(&coords);
        self.chunks.get(&name)
    }

    fn get_chunk_mut(&mut self, coords: &Coords2<i32>) -> Option<&mut Chunk> {
        let name = get_chunk_name(&coords);
        self.chunks.get_mut(&name)
    }
}
