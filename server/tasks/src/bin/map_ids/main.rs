use std::{
    collections::HashMap,
    fs::{self, File},
};

use serde::{Deserialize, Serialize};
use server_common::vec::Vec3;
use server_tasks::loop_through_chunks;

#[derive(Debug, Serialize, Deserialize)]
struct Fixes {
    blocks: Vec<[u32; 2]>,
}

const FIX_PATH: &str = "./assets/metadata/fixes.json";

fn main() {
    println!(
        "Reads ./assets/metadata/fixes.json, maps old ID's to new ID's, then clears 'blocks' assets/metadata/fixes.json\n"
    );

    if let Ok(fixes_file) = File::open(FIX_PATH) {
        let mut fixes: Fixes = serde_json::from_reader(&fixes_file).unwrap();

        let mut block_map = HashMap::new();

        for [old, new] in fixes.blocks.drain(..) {
            block_map.insert(old, new);
        }

        loop_through_chunks(&|chunk, _| {
            let Vec3(start_x, start_y, start_z) = chunk.min;
            let Vec3(end_x, end_y, end_z) = chunk.max;

            for vx in start_x..end_x {
                for vy in start_y..end_y {
                    for vz in start_z..end_z {
                        let id = chunk.get_voxel(vx, vy, vz);

                        if let Some(&new) = block_map.get(&id) {
                            let rotation = chunk.get_voxel_rotation(vx, vy, vz);
                            let stage = chunk.get_voxel_stage(vx, vy, vz);

                            chunk.set_voxel(vx, vy, vz, new);
                            chunk.set_voxel_rotation(vx, vy, vz, &rotation);
                            chunk.set_voxel_stage(vx, vy, vz, stage);
                        }
                    }
                }
            }

            chunk.save();
        });

        let j = serde_json::to_string(&fixes).unwrap();
        fs::write(FIX_PATH, j.as_bytes()).expect("Unable to overwrite fixes.json.");
    }
}
