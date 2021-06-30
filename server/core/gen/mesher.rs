use crate::{
    core::{
        constants::{
            BlockFace, CornerData, CornerSimplified, PlantFace, AO_TABLE, BLOCK_FACES, PLANT_FACES,
        },
        engine::{
            chunk::Chunk,
            registry::{get_texture_type, Registry},
            world::WorldConfig,
        },
    },
    libs::types::{Block, Coords3, MeshType, UV},
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
        let mut aos = Vec::<f32>::new();
        let mut torch_lights = Vec::<i32>::new();
        let mut sunlights = Vec::<i32>::new();

        let &Coords3(start_x, _, start_z) = min_inner;
        let &Coords3(end_x, _, end_z) = max_inner;

        let vertex_ao = |side1: u32, side2: u32, corner: u32| -> usize {
            let num_s1 = !registry.get_transparency_by_id(side1) as usize;
            let num_s2 = !registry.get_transparency_by_id(side2) as usize;
            let num_c = !registry.get_transparency_by_id(corner) as usize;

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
                    let &Block {
                        is_solid,
                        is_transparent,
                        is_block,
                        is_plant,
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
                                    let pos_x =
                                        pos[0] as f32 * plant_shrink + offset + (vx + dx) as f32;
                                    let pos_y = (pos[1] + vy) as f32;
                                    let pos_z =
                                        pos[2] as f32 * plant_shrink + offset + (vz + dz) as f32;

                                    positions.push(pos_x * *dimension as f32);
                                    positions.push(pos_y * *dimension as f32);
                                    positions.push(pos_z * *dimension as f32);

                                    uvs.push(uv[0] as f32 * (end_u - start_u) + start_u);
                                    uvs.push(uv[1] as f32 * (start_v - end_v) + end_v);

                                    sunlights.push(chunk.get_sunlight(vx, vy, vz) as i32);
                                    torch_lights.push(chunk.get_torch_light(vx, vy, vz) as i32);

                                    aos.push(1.0);
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
                                neighbors,
                            } in BLOCK_FACES.iter()
                            {
                                let nvx = vx + dir[0];
                                let nvy = vy + dir[1];
                                let nvz = vz + dir[2];

                                let neighbor_id = chunk.get_voxel(nvx, nvy, nvz);
                                let n_block_type = registry.get_block_by_id(neighbor_id);

                                if n_block_type.is_transparent
                                    && (!transparent
                                        || n_block_type.is_empty
                                        || neighbor_id != voxel_id
                                        || (n_block_type.transparent_standalone
                                            && dir[0] + dir[1] + dir[2] >= 1))
                                {
                                    let near_voxels: Vec<u32> = neighbors
                                        .iter()
                                        .map(|[a, b, c]| chunk.get_voxel(vx + a, vy + b, vz + c))
                                        .collect();

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
                                    let mut four_torch_lights = vec![];

                                    for CornerData {
                                        pos,
                                        uv,
                                        side1,
                                        side2,
                                        corner,
                                    } in corners.iter()
                                    {
                                        let pos_x = pos[0] + vx;
                                        let pos_y = pos[1] + vy;
                                        let pos_z = pos[2] + vz;

                                        positions.push(pos_x as f32 * *dimension as f32);
                                        positions.push(pos_y as f32 * *dimension as f32);
                                        positions.push(pos_z as f32 * *dimension as f32);

                                        uvs.push(uv[0] as f32 * (end_u - start_u) + start_u);
                                        uvs.push(uv[1] as f32 * (start_v - end_v) + end_v);
                                        face_aos.push(
                                            AO_TABLE[vertex_ao(
                                                near_voxels[*side1 as usize],
                                                near_voxels[*side2 as usize],
                                                near_voxels[*corner as usize],
                                            )] / 255.0,
                                        );

                                        // calculating the 8 voxels around this vertex
                                        let dx = pos[0];
                                        let dy = pos[1];
                                        let dz = pos[2];

                                        let dx = if dx == 0 { -1 } else { 1 };
                                        let dy = if dy == 0 { -1 } else { 1 };
                                        let dz = if dz == 0 { -1 } else { 1 };

                                        let mut sum_sunlight = vec![];
                                        let mut sum_torch_light = vec![];

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

                                        // TODO: light be leaking

                                        if b000 {
                                            sum_sunlight.push(chunk.get_sunlight(vx, vy, vz));
                                            sum_torch_light.push(chunk.get_torch_light(vx, vy, vz));
                                        }

                                        if b001 {
                                            sum_sunlight.push(chunk.get_sunlight(vx, vy, vz + dz));
                                            sum_torch_light.push(chunk.get_torch_light(
                                                vx,
                                                vy,
                                                vz + dz,
                                            ));
                                        }

                                        if b010 {
                                            sum_sunlight.push(chunk.get_sunlight(vx, vy + dy, vz));
                                            sum_torch_light.push(chunk.get_torch_light(
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
                                            sum_torch_light.push(chunk.get_torch_light(
                                                vx,
                                                vy + dy,
                                                vz + dz,
                                            ));
                                        }

                                        if b100 {
                                            sum_sunlight.push(chunk.get_sunlight(vx + dx, vy, vz));
                                            sum_torch_light.push(chunk.get_torch_light(
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
                                            sum_torch_light.push(chunk.get_torch_light(
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
                                            sum_torch_light.push(chunk.get_torch_light(
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
                                            sum_torch_light.push(chunk.get_torch_light(
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

                                        four_torch_lights.push(
                                            (sum_torch_light.iter().sum::<u32>() as f32
                                                / sum_torch_light.len() as f32)
                                                as i32,
                                        );
                                    }

                                    let a_t = four_torch_lights[0];
                                    let b_t = four_torch_lights[1];
                                    let c_t = four_torch_lights[2];
                                    let d_t = four_torch_lights[3];

                                    let threshold = 0;

                                    /* -------------------------------------------------------------------------- */
                                    /*                     I KNOW THIS IS UGLY, BUT IT WORKS!                     */
                                    /* -------------------------------------------------------------------------- */
                                    // at least one zero
                                    let one_t0 = a_t <= threshold
                                        || b_t <= threshold
                                        || c_t <= threshold
                                        || d_t <= threshold;
                                    // one is zero, and ao rule, but only for zero AO's
                                    let ozao = a_t + d_t < b_t + c_t
                                        && ((face_aos[0] + face_aos[3])
                                            - (face_aos[1] + face_aos[2]))
                                            .abs()
                                            < f32::EPSILON;
                                    // all not zero, 4 parts
                                    let anzp1 = (b_t as f32 > (a_t + d_t) as f32 / 2.0
                                        && (a_t + d_t) as f32 / 2.0 > c_t as f32)
                                        || (c_t as f32 > (a_t + d_t) as f32 / 2.0
                                            && (a_t + d_t) as f32 / 2.0 > b_t as f32);
                                    // fixed two light sources colliding
                                    let anz = one_t0 && anzp1;

                                    // common starting indices
                                    indices.push(ndx);
                                    indices.push(ndx + 1);

                                    if face_aos[0] + face_aos[3] > face_aos[1] + face_aos[2]
                                        || ozao
                                        || anz
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
                                    torch_lights.append(&mut &mut four_torch_lights);
                                }
                            }
                        }
                    }
                }
            }
        }

        Some(MeshType {
            positions,
            indices,
            uvs,
            aos,
            sunlights,
            torch_lights,
        })
    }
}
