use crate::libs::types::{Coords2, Coords3, FCoords3};

pub fn get_chunk_name(coords: &Coords2, concat: &str) -> String {
    format!("{}{}{}", coords.0, concat, coords.1)
}

pub fn get_voxel_name(coords: &Coords3, concat: &str) -> String {
    format!("{}{}{}{}{}", coords.0, concat, coords.1, concat, coords.2)
}

pub fn parse_chunk_name(name: &String, concat: &str) -> Coords2 {
    let vec = name.split(concat).collect::<Vec<&str>>();
    return Coords2(vec[0].parse().unwrap(), vec[1].parse().unwrap());
}

pub fn parse_voxel_name(name: &String, concat: &str) -> Coords3 {
    let vec = name.split(concat).collect::<Vec<&str>>();
    return Coords3(
        vec[0].parse().unwrap(),
        vec[1].parse().unwrap(),
        vec[2].parse().unwrap(),
    );
}

fn floor_scale_coords(coords: &FCoords3, factor: f32) -> FCoords3 {
    FCoords3(
        (coords.0 * factor).floor(),
        (coords.1 * factor).floor(),
        (coords.2 * factor).floor(),
    )
}

pub fn map_voxel_to_chunk(voxel_pos: &Coords3, chunk_size: i32) -> Coords2 {
    let scaled = Coords3::from_fcoords(&floor_scale_coords(
        &voxel_pos.to_fcoords(),
        1.0 / (chunk_size as f32),
    ));
    Coords2(scaled.0, scaled.2)
}

pub fn map_voxel_to_chunk_local(voxel_pos: &Coords3, chunk_size: i32) -> Coords3 {
    let Coords2(cx, cz) = map_voxel_to_chunk(voxel_pos, chunk_size);
    let Coords3(vx, vy, vz) = voxel_pos;

    Coords3(vx - cx * chunk_size, *vy, vz - cz * chunk_size)
}

pub fn map_world_to_voxel(world_pos: &FCoords3, dimension: i32) -> Coords3 {
    Coords3::from_fcoords(&floor_scale_coords(world_pos, 1.0 / (dimension as f32)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chunk_name_works() {
        let coords = Coords2(1, 2);
        assert_eq!(get_chunk_name(&coords, "_"), "1_2");
    }

    #[test]
    fn voxel_name_works() {
        let coords = Coords3(1, 2, 3);
        assert_eq!(get_voxel_name(&coords, "_"), "1_2_3");
    }

    #[test]
    fn parse_chunk_name_works() {
        let name = String::from("-1_2");
        let coords = parse_chunk_name(&name, "_");
        assert_eq!(coords, Coords2(-1, 2));
    }

    #[test]
    fn parse_voxel_name_works() {
        let name = String::from("-2_-4_-5");
        let coords = parse_voxel_name(&name, "_");
        assert_eq!(coords, Coords3(-2, -4, -5));
    }

    #[test]
    fn mapping() {
        const CHUNK_SIZE: i32 = 16;

        let world = FCoords3(0.0, 102.3, 46.1);

        let voxel = map_world_to_voxel(&world, 2);
        assert_eq!(voxel, Coords3(0, 51, 23));

        let coords = map_voxel_to_chunk(&voxel, CHUNK_SIZE);
        assert_eq!(coords, Coords2(0, 1));

        let local = map_voxel_to_chunk_local(&voxel, CHUNK_SIZE);
        assert_eq!(local, Coords3(0, 51, 7));
    }
}
