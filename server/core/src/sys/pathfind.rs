#![allow(clippy::collapsible_if)]

use std::sync::{Arc, Mutex};

use server_common::vec::Vec3;
use server_utils::convert::map_world_to_voxel;
use specs::{ReadExpect, ReadStorage, System, WriteStorage};

use crate::{
    comp::{rigidbody::RigidBody, target::Target, walk_towards::WalkTowards},
    engine::{
        astar::{AStar, PathNode},
        chunks::Chunks,
    },
};

const MAX_DEPTH_SEARCH: i32 = 2048;

pub struct PathFindSystem;

impl<'a> System<'a> for PathFindSystem {
    #[allow(clippy::type_complexity)]
    type SystemData = (
        ReadExpect<'a, Chunks>,
        ReadStorage<'a, RigidBody>,
        ReadStorage<'a, Target>,
        WriteStorage<'a, WalkTowards>,
    );

    fn run(&mut self, data: Self::SystemData) {
        use specs::Join;

        let (chunks, bodies, targets, mut walk_towards) = data;

        let dimension = chunks.config.dimension;

        // Returns whether or not a block can be stepped on
        let walkable = |vx: i32, vy: i32, vz: i32, h: f32| {
            if chunks.get_walkable_by_voxel(vx, vy, vz) {
                return false;
            }

            for i in 1..(h.ceil() as i32 + 1) {
                if !chunks.get_walkable_by_voxel(vx, vy + i, vz) {
                    return false;
                }
            }

            true
        };

        for (body, target, walk_toward) in (&bodies, &targets, &mut walk_towards).join() {
            if let Some(position) = target.get_position() {
                let body_pos = body.get_position();
                let body_dim = body.get_dimension();

                let body_vpos = map_world_to_voxel(body_pos.0, body_pos.1, body_pos.2, dimension);
                let target_vpos = map_world_to_voxel(position.0, position.1, position.2, dimension);

                let start = chunks.get_standable_voxel(&body_vpos);
                let goal = chunks.get_standable_voxel(&target_vpos);

                let height = body_dim.1;

                let count = Arc::new(Mutex::new(0));

                let path = AStar::calculate(
                    &start,
                    &goal,
                    &|node| {
                        let &PathNode(vx, vy, vz) = node;
                        let mut successors = vec![];
                        let mut locked_count = count.lock().unwrap();

                        *locked_count += 1;
                        if *locked_count >= MAX_DEPTH_SEARCH {
                            return successors;
                        }

                        // emptiness
                        let py = !walkable(vx, vy + 1, vz, height);
                        let px = !walkable(vx + 1, vy, vz, height);
                        let pz = !walkable(vx, vy, vz + 1, height);
                        let nx = !walkable(vx - 1, vy, vz, height);
                        let nz = !walkable(vx, vy, vz - 1, height);
                        let pxpy = !walkable(vx + 1, vy + 1, vz, height);
                        let pzpy = !walkable(vx, vy + 1, vz + 1, height);
                        let nxpy = !walkable(vx - 1, vy + 1, vz, height);
                        let nzpy = !walkable(vx, vy + 1, vz - 1, height);

                        // +X direction
                        if walkable(vx + 1, vy - 1, vz, height) {
                            successors.push((PathNode(vx + 1, vy, vz), 1));
                        } else if walkable(vx + 1, vy, vz, height) && py {
                            successors.push((PathNode(vx + 1, vy + 1, vz), 2));
                        } else if walkable(vx + 1, vy - 2, vz, height) && px {
                            successors.push((PathNode(vx + 1, vy - 1, vz), 2));
                        }

                        // -X direction
                        if walkable(vx - 1, vy - 1, vz, height) {
                            successors.push((PathNode(vx - 1, vy, vz), 1));
                        } else if walkable(vx - 1, vy, vz, height) && py {
                            successors.push((PathNode(vx - 1, vy + 1, vz), 2));
                        } else if walkable(vx - 1, vy - 2, vz, height) && nx {
                            successors.push((PathNode(vx - 1, vy - 1, vz), 2));
                        }

                        // +Z direction
                        if walkable(vx, vy - 1, vz + 1, height) {
                            successors.push((PathNode(vx, vy, vz + 1), 1));
                        } else if walkable(vx, vy, vz + 1, height) && py {
                            successors.push((PathNode(vx, vy + 1, vz + 1), 2));
                        } else if walkable(vx, vy - 2, vz + 1, height) && pz {
                            successors.push((PathNode(vx, vy - 1, vz + 1), 2));
                        }

                        // -Z direction
                        if walkable(vx, vy - 1, vz - 1, height) {
                            successors.push((PathNode(vx, vy, vz - 1), 1));
                        } else if walkable(vx, vy, vz - 1, height) && py {
                            successors.push((PathNode(vx, vy + 1, vz - 1), 2));
                        } else if walkable(vx, vy - 2, vz - 1, height) && nz {
                            successors.push((PathNode(vx, vy - 1, vz - 1), 2));
                        }

                        // +X+Z direction
                        if walkable(vx + 1, vy - 1, vz + 1, height) && px && pz {
                            successors.push((PathNode(vx + 1, vy, vz + 1), 2));
                        } else if walkable(vx + 1, vy, vz + 1, height) && py && pxpy && pzpy {
                            successors.push((PathNode(vx + 1, vy + 1, vz + 1), 3));
                        } else if walkable(vx + 1, vy - 2, vz + 1, height) && px && pz {
                            successors.push((PathNode(vx + 1, vy - 1, vz + 1), 3));
                        }

                        // +X-Z direction
                        if walkable(vx + 1, vy - 1, vz - 1, height) && px && nz {
                            successors.push((PathNode(vx + 1, vy, vz - 1), 2));
                        } else if walkable(vx + 1, vy, vz - 1, height) && py && pxpy && nzpy {
                            successors.push((PathNode(vx + 1, vy + 1, vz - 1), 3));
                        } else if walkable(vx + 1, vy - 2, vz - 1, height) && px && nz {
                            successors.push((PathNode(vx + 1, vy - 1, vz - 1), 3));
                        }

                        // -X+Z direction
                        if walkable(vx - 1, vy - 1, vz + 1, height) && nx && pz {
                            successors.push((PathNode(vx - 1, vy, vz + 1), 2));
                        } else if walkable(vx - 1, vy, vz + 1, height) && py && nxpy && pzpy {
                            successors.push((PathNode(vx - 1, vy + 1, vz + 1), 3));
                        } else if walkable(vx - 1, vy - 2, vz + 1, height) && nx && pz {
                            successors.push((PathNode(vx - 1, vy - 1, vz + 1), 3));
                        }

                        // -X-Z direction
                        if walkable(vx - 1, vy - 1, vz - 1, height) && nx && nz {
                            successors.push((PathNode(vx - 1, vy, vz - 1), 2));
                        } else if walkable(vx - 1, vy, vz - 1, height) && py && nxpy && nzpy {
                            successors.push((PathNode(vx - 1, vy + 1, vz - 1), 3));
                        } else if walkable(vx - 1, vy - 2, vz - 1, height) && nx && nz {
                            successors.push((PathNode(vx - 1, vy - 1, vz - 1), 3));
                        }

                        successors
                    },
                    &|p| p.distance(&PathNode(goal.0, goal.1, goal.2)) / 3,
                );

                if let Some((nodes, _count)) = path {
                    walk_toward.0 = Some(
                        nodes
                            .clone()
                            .iter()
                            .map(|p| Vec3(p.0, p.1, p.2))
                            .collect::<Vec<_>>(),
                    );
                } else {
                    walk_toward.0 = None;
                }
            }
        }
    }
}
