use server_common::vec::Vec3;
use server_tasks::loop_through_chunks;

fn main() {
    println!("Cleaning ./data and removing non-existent blocks + corrupted chunk files...\n");

    loop_through_chunks(&|chunk, registry| {
        let Vec3(start_x, start_y, start_z) = chunk.min;
        let Vec3(end_x, end_y, end_z) = chunk.max;

        for vx in start_x..end_x {
            for vy in start_y..end_y {
                for vz in start_z..end_z {
                    let id = chunk.get_voxel(vx, vy, vz);

                    if !registry.has_type(id) {
                        chunk.set_voxel(vx, vy, vz, 0);
                    }
                }
            }
        }

        chunk.save();
    });
}
