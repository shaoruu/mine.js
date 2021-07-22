use serde::Serialize;

use pathfinding::prelude::{absdiff, astar};

use server_common::vec::Vec3;

#[derive(Debug, Clone, Serialize, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct PathNode(pub i32, pub i32, pub i32);

impl PathNode {
    fn from_vec3(vec3: &Vec3<i32>) -> Self {
        Self(vec3.0, vec3.1, vec3.2)
    }

    fn distance(&self, other: &Self) -> u32 {
        (absdiff(self.0, other.0) + absdiff(self.1, other.1) + absdiff(self.2, other.2)) as u32
    }
}

#[derive(Default)]
pub struct AStar;

impl AStar {
    pub fn calculate(
        start: &Vec3<i32>,
        goal: &Vec3<i32>,
        successors: &dyn Fn(&PathNode) -> Vec<(PathNode, u32)>,
        heuristic: &dyn Fn(&PathNode) -> u32,
    ) -> Option<(Vec<PathNode>, u32)> {
        let start_node = PathNode::from_vec3(start);
        let goal_node = PathNode::from_vec3(goal);

        astar(&start_node, successors, heuristic, |p| *p == goal_node)
    }
}
