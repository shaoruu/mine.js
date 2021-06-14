use rayon::prelude::*;
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

        // TODO: need to implement neighbors
        match chunk {
            None => None,
            Some(chunk) => {
                if chunk.needs_terrain || chunk.needs_decoration {
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

    pub async fn prelaod(&mut self, width: i16) {
        self.load(Coords2(0, 0), width, false).await;
    }

    pub async fn generate(&mut self, client: WsSession) {
        let current_chunk = client.current_chunk;
        let render_radius = client.render_radius;

        self.load(current_chunk, render_radius, false).await;
    }

    pub fn unload() {
        todo!();
    }

    async fn load(&mut self, coords: Coords2<i32>, render_radius: i16, should_mesh: bool) {
        let Self {
            chunk_size,
            max_height,
            ..
        } = self;

        let Coords2(cx, cz) = coords;

        let mut to_decorate: Vec<&Chunk> = Vec::new();
        let mut to_generate: Vec<Option<&Chunk>> = Vec::new();

        let terrain_radius = render_radius + 4;
        let decorate_radius = render_radius;

        for x in -terrain_radius..=terrain_radius {
            for z in -terrain_radius..=terrain_radius {
                let dist = x * x + z * z;

                if dist >= terrain_radius * terrain_radius {
                    continue;
                }

                let coords = Coords2(cx + x as i32, cz + z as i32);
                to_generate.push(self.get_chunk(&coords))
            }
        }

        to_generate.par_iter().for_each(|&c| {
            if let Some(chunk) = c {
                println!("{}", chunk.name);
            }
        });
    }

    fn make_chunk(&mut self, coords: Coords2<i32>) {
        let chunk = Chunk::new(coords, self.chunk_size, self.max_height);
        self.chunks.insert(chunk.name.to_owned(), chunk);
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
