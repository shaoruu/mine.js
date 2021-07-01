#![allow(dead_code)]

use crate::libs::types::{Coords2, Coords3};

const CONCAT: &str = "_";

pub fn get_chunk_name(x: i32, z: i32) -> String {
    format!("{}{}{}", x, CONCAT, z)
}

pub fn get_voxel_name(x: i32, y: i32, z: i32) -> String {
    format!("{}{}{}{}{}", x, CONCAT, y, CONCAT, z)
}

pub fn get_position_name(x: f32, y: f32, z: f32) -> String {
    format!("{}{}{}{}{}", x, CONCAT, y, CONCAT, z)
}

pub fn parse_chunk_name(name: &str) -> Coords2<i32> {
    let vec = name.split(CONCAT).collect::<Vec<&str>>();
    Coords2(vec[0].parse().unwrap(), vec[1].parse().unwrap())
}

pub fn parse_voxel_name(name: &str) -> Coords3<i32> {
    let vec = name.split(CONCAT).collect::<Vec<&str>>();
    Coords3(
        vec[0].parse().unwrap(),
        vec[1].parse().unwrap(),
        vec[2].parse().unwrap(),
    )
}

fn floor_scale_coords(x: f32, y: f32, z: f32, factor: f32) -> Coords3<f32> {
    Coords3(
        (x * factor).floor(),
        (y * factor).floor(),
        (z * factor).floor(),
    )
}

pub fn map_voxel_to_chunk(vx: i32, vy: i32, vz: i32, chunk_size: usize) -> Coords2<i32> {
    let scaled = Coords3::<i32>::from(&floor_scale_coords(
        vx as f32,
        vy as f32,
        vz as f32,
        1.0 / (chunk_size as f32),
    ));
    Coords2(scaled.0, scaled.2)
}

pub fn map_voxel_to_chunk_local(vx: i32, vy: i32, vz: i32, chunk_size: usize) -> Coords3<i32> {
    let Coords2(cx, cz) = map_voxel_to_chunk(vx, vy, vz, chunk_size);
    let cs = chunk_size as i32;

    Coords3(vx - cx * cs, vy, vz - cz * cs)
}

pub fn map_world_to_voxel(wx: f32, wy: f32, wz: f32, dimension: usize) -> Coords3<i32> {
    Coords3::<i32>::from(&floor_scale_coords(wx, wy, wz, 1.0 / (dimension as f32)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chunk_name_works() {
        assert_eq!(get_chunk_name(1, 2), "1_2");
    }

    #[test]
    fn voxel_name_works() {
        assert_eq!(get_voxel_name(1, 2, 3), "1_2_3");
    }

    #[test]
    fn parse_chunk_name_works() {
        let name = String::from("-1_2");
        let coords = parse_chunk_name(&name);
        assert_eq!(coords, Coords2(-1, 2));
    }

    #[test]
    fn parse_voxel_name_works() {
        let name = String::from("-2_-4_-5");
        let coords = parse_voxel_name(&name);
        assert_eq!(coords, Coords3(-2, -4, -5));
    }

    #[test]
    fn mapping() {
        const CHUNK_SIZE: usize = 16;

        let wx = 0.0 as f32;
        let wy = 102.3 as f32;
        let wz = 46.1 as f32;

        let voxel = map_world_to_voxel(wx, wy, wz, 2);
        assert_eq!(voxel, Coords3(0, 51, 23));

        let Coords3(vx, vy, vz) = voxel;
        let coords = map_voxel_to_chunk(vx, vy, vz, CHUNK_SIZE);
        assert_eq!(coords, Coords2(0, 1));

        let local = map_voxel_to_chunk_local(vx, vy, vz, CHUNK_SIZE);
        assert_eq!(local, Coords3(0, 51, 7));
    }
}
