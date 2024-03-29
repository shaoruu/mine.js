#![allow(clippy::collapsible_else_if)]

use itertools::izip;

use super::super::{
    constants::{BlockFace, CornerData, CornerSimplified, PlantFace, BLOCK_FACES, PLANT_FACES},
    engine::{
        chunk::Chunk,
        registry::{get_texture_type, Registry},
        world::WorldConfig,
    },
    gen::lights::Lights,
};

use server_common::{
    types::{Block, MeshType, UV},
    vec::Vec3,
};

pub struct Mesher;

fn get_block_by_voxel<'a>(
    vx: i32,
    vy: i32,
    vz: i32,
    chunk: &Chunk,
    registry: &'a Registry,
) -> &'a Block {
    registry.get_block_by_id(chunk.get_voxel(vx, vy, vz))
}

impl Mesher {
    /// Meshing a chunk. Poorly written. Needs refactor.
    pub fn mesh_chunk(
        chunk: &Chunk,
        transparent: bool,
        sub_chunk: u32,
        config: &WorldConfig,
        registry: &Registry,
    ) -> Option<MeshType> {
        let Chunk {
            min_inner,
            max_inner,
            dimension,
            ..
        } = chunk;

        let WorldConfig {
            max_height,
            sub_chunks,
            ..
        } = config;

        let mut positions = Vec::<f32>::new();
        let mut indices = Vec::<i32>::new();
        let mut uvs = Vec::<f32>::new();
        let mut aos = Vec::<i32>::new();
        let mut red_lights = Vec::<i32>::new();
        let mut green_lights = Vec::<i32>::new();
        let mut blue_lights = Vec::<i32>::new();
        let mut sunlights = Vec::<i32>::new();

        let &Vec3(start_x, _, start_z) = min_inner;
        let &Vec3(end_x, _, end_z) = max_inner;

        let vertex_ao = |side1: bool, side2: bool, corner: bool| -> i32 {
            let num_s1 = !side1 as i32;
            let num_s2 = !side2 as i32;
            let num_c = !corner as i32;

            if num_s1 == 1 && num_s2 == 1 {
                0
            } else {
                3 - (num_s1 + num_s2 + num_c)
            }
        };

        let plant_shrink = 0.6;

        let sub_chunk_unit = max_height / sub_chunks;

        for vx in start_x..end_x {
            for vz in start_z..end_z {
                for vy in
                    (sub_chunk * sub_chunk_unit) as i32..((sub_chunk + 1) * sub_chunk_unit) as i32
                {
                    let voxel_id = chunk.get_voxel(vx, vy, vz);
                    let rotation = chunk.get_voxel_rotation(vx, vy, vz);
                    let &Block {
                        rotatable,
                        is_solid,
                        is_transparent,
                        is_block,
                        is_plant,
                        is_fluid,
                        ..
                    } = registry.get_block_by_id(voxel_id);

                    // TODO: simplify this logic
                    if (is_solid || is_plant)
                        && (if transparent {
                            is_transparent
                        } else {
                            !is_transparent
                        })
                    {
                        let texture = registry.get_texture_by_id(voxel_id);
                        let texture_type = get_texture_type(texture);
                        let uv_map = registry.get_uv_by_id(voxel_id);

                        if is_plant {
                            let [dx, dz] = [0, 0];

                            for PlantFace { corners, mat } in PLANT_FACES.iter() {
                                let UV {
                                    start_u,
                                    end_u,
                                    start_v,
                                    end_v,
                                } = uv_map.get(texture.get(*mat).unwrap()).unwrap();
                                let ndx = (positions.len() / 3) as i32;

                                for &CornerSimplified { pos, uv } in corners.iter() {
                                    let offset = (1.0 - plant_shrink) / 2.0;

                                    let mut position = [
                                        pos[0] as f32 * plant_shrink + offset,
                                        pos[1] as f32,
                                        pos[2] as f32 * plant_shrink + offset,
                                    ];

                                    if rotatable {
                                        rotation.rotate(&mut position, true);
                                    }

                                    let pos_x = position[0] + (vx + dx) as f32;
                                    let pos_y = position[1] + vy as f32;
                                    let pos_z = position[2] + (vz + dz) as f32;

                                    positions.push(pos_x * *dimension as f32);
                                    positions.push(pos_y * *dimension as f32);
                                    positions.push(pos_z * *dimension as f32);

                                    uvs.push(uv[0] as f32 * (end_u - start_u) + start_u);
                                    uvs.push(uv[1] as f32 * (start_v - end_v) + end_v);

                                    sunlights.push(chunk.get_sunlight(vx, vy, vz) as i32);
                                    red_lights.push(chunk.get_red_light(vx, vy, vz) as i32);
                                    green_lights.push(chunk.get_green_light(vx, vy, vz) as i32);
                                    blue_lights.push(chunk.get_blue_light(vx, vy, vz) as i32);

                                    aos.push(3);
                                }

                                indices.push(ndx);
                                indices.push(ndx + 1);
                                indices.push(ndx + 2);
                                indices.push(ndx + 2);
                                indices.push(ndx + 1);
                                indices.push(ndx + 3);
                            }
                        } else if is_block {
                            let is_mat_1 = texture_type == "mat1";
                            let is_mat_3 = texture_type == "mat3";

                            for BlockFace {
                                dir,
                                mat3,
                                mat6,
                                corners,
                            } in BLOCK_FACES.iter()
                            {
                                let dir = dir.to_owned();
                                let mut dir = [dir[0] as f32, dir[1] as f32, dir[2] as f32];

                                if rotatable {
                                    rotation.rotate(&mut dir, false);
                                }

                                let dir = [
                                    dir[0].round() as i32,
                                    dir[1].round() as i32,
                                    dir[2].round() as i32,
                                ];

                                let nvx = vx + dir[0];
                                let nvy = vy + dir[1];
                                let nvz = vz + dir[2];

                                let neighbor_id = chunk.get_voxel(nvx, nvy, nvz);
                                let n_block_type = registry.get_block_by_id(neighbor_id);

                                if ((n_block_type.is_transparent && !n_block_type.is_fluid)
                                    || (n_block_type.is_fluid && !is_fluid))
                                    && (!transparent
                                        || n_block_type.is_empty
                                        || neighbor_id != voxel_id
                                        || (n_block_type.transparent_standalone
                                            && dir[0] + dir[1] + dir[2] >= 1))
                                {
                                    let UV {
                                        start_u,
                                        end_u,
                                        start_v,
                                        end_v,
                                    } = if is_mat_1 {
                                        uv_map.get(texture.get("all").unwrap()).unwrap()
                                    } else if is_mat_3 {
                                        uv_map.get(texture.get(*mat3).unwrap()).unwrap()
                                    } else {
                                        uv_map.get(texture.get(*mat6).unwrap()).unwrap()
                                    };

                                    let ndx = (positions.len() / 3) as i32;
                                    let mut face_aos = vec![];

                                    let mut four_sunlights = vec![];
                                    let mut four_red_lights = vec![];
                                    let mut four_green_lights = vec![];
                                    let mut four_blue_lights = vec![];

                                    for CornerData { pos, uv } in corners.iter() {
                                        let mut position =
                                            [pos[0] as f32, pos[1] as f32, pos[2] as f32];

                                        if rotatable {
                                            rotation.rotate(&mut position, true);
                                        }

                                        let pos_x = position[0] + vx as f32;
                                        let pos_y = position[1] + vy as f32;
                                        let pos_z = position[2] + vz as f32;

                                        positions.push(pos_x * *dimension as f32);
                                        positions.push(pos_y * *dimension as f32);
                                        positions.push(pos_z * *dimension as f32);

                                        uvs.push(uv[0] as f32 * (end_u - start_u) + start_u);
                                        uvs.push(uv[1] as f32 * (start_v - end_v) + end_v);

                                        // calculating the 8 voxels around this vertex
                                        let dx = position[0].round() as i32;
                                        let dy = position[1].round() as i32;
                                        let dz = position[2].round() as i32;

                                        let dx = if dx == 0 { -1 } else { 1 };
                                        let dy = if dy == 0 { -1 } else { 1 };
                                        let dz = if dz == 0 { -1 } else { 1 };

                                        let mut sum_sunlight = vec![];
                                        let mut sum_red_lights = vec![];
                                        let mut sum_green_lights = vec![];
                                        let mut sum_blue_lights = vec![];

                                        let b000 = get_block_by_voxel(vx, vy, vz, chunk, registry)
                                            .is_transparent;
                                        let b001 =
                                            get_block_by_voxel(vx, vy, vz + dz, chunk, registry)
                                                .is_transparent;
                                        let b010 =
                                            get_block_by_voxel(vx, vy + dy, vz, chunk, registry)
                                                .is_transparent;
                                        let b011 = get_block_by_voxel(
                                            vx,
                                            vy + dy,
                                            vz + dz,
                                            chunk,
                                            registry,
                                        )
                                        .is_transparent;
                                        let b100 =
                                            get_block_by_voxel(vx + dx, vy, vz, chunk, registry)
                                                .is_transparent;
                                        let b101 = get_block_by_voxel(
                                            vx + dx,
                                            vy,
                                            vz + dz,
                                            chunk,
                                            registry,
                                        )
                                        .is_transparent;
                                        let b110 = get_block_by_voxel(
                                            vx + dx,
                                            vy + dy,
                                            vz,
                                            chunk,
                                            registry,
                                        )
                                        .is_transparent;
                                        let b111 = get_block_by_voxel(
                                            vx + dx,
                                            vy + dy,
                                            vz + dz,
                                            chunk,
                                            registry,
                                        )
                                        .is_transparent;

                                        if dir[0].abs() == 1 {
                                            face_aos.push(vertex_ao(b110, b101, b111));
                                        } else if dir[1].abs() == 1 {
                                            face_aos.push(vertex_ao(b110, b011, b111));
                                        } else {
                                            face_aos.push(vertex_ao(b011, b101, b111));
                                        }

                                        // TODO: light be leaking

                                        if b000 {
                                            sum_sunlight.push(chunk.get_sunlight(vx, vy, vz));
                                            sum_red_lights.push(chunk.get_red_light(vx, vy, vz));
                                            sum_green_lights
                                                .push(chunk.get_green_light(vx, vy, vz));
                                            sum_blue_lights.push(chunk.get_blue_light(vx, vy, vz));
                                        }

                                        if b001 {
                                            sum_sunlight.push(chunk.get_sunlight(vx, vy, vz + dz));
                                            sum_red_lights.push(chunk.get_red_light(
                                                vx,
                                                vy,
                                                vz + dz,
                                            ));
                                            sum_green_lights.push(chunk.get_green_light(
                                                vx,
                                                vy,
                                                vz + dz,
                                            ));
                                            sum_blue_lights.push(chunk.get_blue_light(
                                                vx,
                                                vy,
                                                vz + dz,
                                            ));
                                        }

                                        if b010 {
                                            sum_sunlight.push(chunk.get_sunlight(vx, vy + dy, vz));
                                            sum_red_lights.push(chunk.get_red_light(
                                                vx,
                                                vy + dy,
                                                vz,
                                            ));
                                            sum_green_lights.push(chunk.get_green_light(
                                                vx,
                                                vy + dy,
                                                vz,
                                            ));
                                            sum_blue_lights.push(chunk.get_blue_light(
                                                vx,
                                                vy + dy,
                                                vz,
                                            ));
                                        }

                                        if b011 {
                                            sum_sunlight.push(chunk.get_sunlight(
                                                vx,
                                                vy + dy,
                                                vz + dz,
                                            ));
                                            sum_red_lights.push(chunk.get_red_light(
                                                vx,
                                                vy + dy,
                                                vz + dz,
                                            ));
                                            sum_green_lights.push(chunk.get_green_light(
                                                vx,
                                                vy + dy,
                                                vz + dz,
                                            ));
                                            sum_blue_lights.push(chunk.get_blue_light(
                                                vx,
                                                vy + dy,
                                                vz + dz,
                                            ));
                                        }

                                        if b100 {
                                            sum_sunlight.push(chunk.get_sunlight(vx + dx, vy, vz));
                                            sum_red_lights.push(chunk.get_red_light(
                                                vx + dx,
                                                vy,
                                                vz,
                                            ));
                                            sum_green_lights.push(chunk.get_green_light(
                                                vx + dx,
                                                vy,
                                                vz,
                                            ));
                                            sum_blue_lights.push(chunk.get_blue_light(
                                                vx + dx,
                                                vy,
                                                vz,
                                            ));
                                        }

                                        if b101 {
                                            sum_sunlight.push(chunk.get_sunlight(
                                                vx + dx,
                                                vy,
                                                vz + dz,
                                            ));
                                            sum_red_lights.push(chunk.get_red_light(
                                                vx + dx,
                                                vy,
                                                vz + dz,
                                            ));
                                            sum_green_lights.push(chunk.get_green_light(
                                                vx + dx,
                                                vy,
                                                vz + dz,
                                            ));
                                            sum_blue_lights.push(chunk.get_blue_light(
                                                vx + dx,
                                                vy,
                                                vz + dz,
                                            ));
                                        }

                                        if b110 {
                                            sum_sunlight.push(chunk.get_sunlight(
                                                vx + dx,
                                                vy + dy,
                                                vz,
                                            ));
                                            sum_red_lights.push(chunk.get_red_light(
                                                vx + dx,
                                                vy + dy,
                                                vz,
                                            ));
                                            sum_green_lights.push(chunk.get_green_light(
                                                vx + dx,
                                                vy + dy,
                                                vz,
                                            ));
                                            sum_blue_lights.push(chunk.get_blue_light(
                                                vx + dx,
                                                vy + dy,
                                                vz,
                                            ));
                                        }

                                        if b111 {
                                            sum_sunlight.push(chunk.get_sunlight(
                                                vx + dx,
                                                vy + dy,
                                                vz + dz,
                                            ));
                                            sum_red_lights.push(chunk.get_red_light(
                                                vx + dx,
                                                vy + dy,
                                                vz + dz,
                                            ));
                                            sum_green_lights.push(chunk.get_green_light(
                                                vx + dx,
                                                vy + dy,
                                                vz + dz,
                                            ));
                                            sum_blue_lights.push(chunk.get_blue_light(
                                                vx + dx,
                                                vy + dy,
                                                vz + dz,
                                            ));
                                        }

                                        four_sunlights.push(
                                            (sum_sunlight.iter().sum::<u32>() as f32
                                                / sum_sunlight.len() as f32)
                                                as i32,
                                        );

                                        four_red_lights.push(
                                            (sum_red_lights.iter().sum::<u32>() as f32
                                                / sum_red_lights.len() as f32)
                                                as i32,
                                        );

                                        four_green_lights.push(
                                            (sum_green_lights.iter().sum::<u32>() as f32
                                                / sum_green_lights.len() as f32)
                                                as i32,
                                        );

                                        four_blue_lights.push(
                                            (sum_blue_lights.iter().sum::<u32>() as f32
                                                / sum_blue_lights.len() as f32)
                                                as i32,
                                        );
                                    }

                                    let a_rt = four_red_lights[0];
                                    let b_rt = four_red_lights[1];
                                    let c_rt = four_red_lights[2];
                                    let d_rt = four_red_lights[3];

                                    let a_gt = four_green_lights[0];
                                    let b_gt = four_green_lights[1];
                                    let c_gt = four_green_lights[2];
                                    let d_gt = four_green_lights[3];

                                    let a_bt = four_blue_lights[0];
                                    let b_bt = four_blue_lights[1];
                                    let c_bt = four_blue_lights[2];
                                    let d_bt = four_blue_lights[3];

                                    let threshold = 0;

                                    /* -------------------------------------------------------------------------- */
                                    /*                     I KNOW THIS IS UGLY, BUT IT WORKS!                     */
                                    /* -------------------------------------------------------------------------- */
                                    // at least one zero
                                    let one_tr0 = a_rt <= threshold
                                        || b_rt <= threshold
                                        || c_rt <= threshold
                                        || d_rt <= threshold;
                                    let one_tg0 = a_gt <= threshold
                                        || b_gt <= threshold
                                        || c_gt <= threshold
                                        || d_gt <= threshold;
                                    let one_tb0 = a_bt <= threshold
                                        || b_bt <= threshold
                                        || c_bt <= threshold
                                        || d_bt <= threshold;
                                    // one is zero, and ao rule, but only for zero AO's
                                    let fequals =
                                        (face_aos[0] + face_aos[3]) == (face_aos[1] + face_aos[2]);
                                    let ozao_r = a_rt + d_rt < b_rt + c_rt && fequals;
                                    let ozao_g = a_gt + d_gt < b_gt + c_gt && fequals;
                                    let ozao_b = a_bt + d_bt < b_bt + c_bt && fequals;
                                    // all not zero, 4 parts
                                    let anzp1_r = (b_rt as f32 > (a_rt + d_rt) as f32 / 2.0
                                        && (a_rt + d_rt) as f32 / 2.0 > c_rt as f32)
                                        || (c_rt as f32 > (a_rt + d_rt) as f32 / 2.0
                                            && (a_rt + d_rt) as f32 / 2.0 > b_rt as f32);
                                    let anzp1_g = (b_gt as f32 > (a_gt + d_gt) as f32 / 2.0
                                        && (a_gt + d_gt) as f32 / 2.0 > c_gt as f32)
                                        || (c_gt as f32 > (a_gt + d_gt) as f32 / 2.0
                                            && (a_gt + d_gt) as f32 / 2.0 > b_gt as f32);
                                    let anzp1_b = (b_bt as f32 > (a_bt + d_bt) as f32 / 2.0
                                        && (a_bt + d_bt) as f32 / 2.0 > c_bt as f32)
                                        || (c_bt as f32 > (a_bt + d_bt) as f32 / 2.0
                                            && (a_bt + d_bt) as f32 / 2.0 > b_bt as f32);
                                    // fixed two light sources colliding
                                    let anz_r = one_tr0 && anzp1_r;
                                    let anz_g = one_tg0 && anzp1_g;
                                    let anz_b = one_tb0 && anzp1_b;

                                    // common starting indices
                                    indices.push(ndx);
                                    indices.push(ndx + 1);

                                    if face_aos[0] + face_aos[3] > face_aos[1] + face_aos[2]
                                        || (ozao_r || ozao_g || ozao_b)
                                        || (anz_r || anz_g || anz_b)
                                    {
                                        // generate flipped quad
                                        indices.push(ndx + 3);
                                        indices.push(ndx + 3);
                                        indices.push(ndx + 2);
                                        indices.push(ndx);
                                    } else {
                                        indices.push(ndx + 2);
                                        indices.push(ndx + 2);
                                        indices.push(ndx + 1);
                                        indices.push(ndx + 3);
                                    }

                                    aos.append(&mut face_aos);
                                    sunlights.append(&mut four_sunlights);
                                    red_lights.append(&mut four_red_lights);
                                    green_lights.append(&mut four_green_lights);
                                    blue_lights.append(&mut four_blue_lights);
                                }
                            }
                        }
                    }
                }
            }
        }

        let mut lights = vec![];

        for (s, r, g, b) in izip!(&sunlights, &red_lights, &green_lights, &blue_lights) {
            let mut light = 0;
            light = Lights::insert_red_light(light, *r as u32);
            light = Lights::insert_green_light(light, *g as u32);
            light = Lights::insert_blue_light(light, *b as u32);
            light = Lights::insert_sunlight(light, *s as u32);
            lights.push(light as i32);
        }

        Some(MeshType {
            positions,
            indices,
            uvs,
            aos,
            lights,
        })
    }
}
