use kdtree::distance::squared_euclidean;
use kdtree::KdTree as KdTreeCore;

use server_common::vec::Vec3;
use specs::Entity;

#[derive(Debug)]
pub struct KdTree {
    union: KdTreeCore<f32, Entity, [f32; 3]>,
    players: KdTreeCore<f32, Entity, [f32; 3]>,
    entities: KdTreeCore<f32, Entity, [f32; 3]>,
}

impl Default for KdTree {
    fn default() -> Self {
        Self::new()
    }
}

impl KdTree {
    pub fn new() -> Self {
        Self {
            union: KdTreeCore::new(3),
            players: KdTreeCore::new(3),
            entities: KdTreeCore::new(3),
        }
    }

    pub fn reset(&mut self) {
        self.union = KdTreeCore::new(3);
        self.players = KdTreeCore::new(3);
        self.entities = KdTreeCore::new(3);
    }

    pub fn add_player(&mut self, id: Entity, point: Vec3<f32>) {
        self.players
            .add([point.0, point.1, point.2], id)
            .expect("Unable to construct KdTree.");

        self.union
            .add([point.0, point.1, point.2], id)
            .expect("Unable to construct KdTree.");
    }

    pub fn add_entity(&mut self, id: Entity, point: Vec3<f32>) {
        self.entities
            .add([point.0, point.1, point.2], id)
            .expect("Unable to construct KdTree.");

        self.union
            .add([point.0, point.1, point.2], id)
            .expect("Unable to construct KdTree.");
    }

    pub fn search(&self, point: &Vec3<f32>, count: usize) -> Vec<(f32, &Entity)> {
        self.union
            .nearest(&[point.0, point.1, point.2], count, &squared_euclidean)
            .expect("Unable to search KdTree.")
    }

    pub fn search_player(&self, point: &Vec3<f32>, count: usize) -> Vec<(f32, &Entity)> {
        self.players
            .nearest(&[point.0, point.1, point.2], count, &squared_euclidean)
            .expect("Unable to search KdTree.")
    }

    pub fn search_entity(&self, point: &Vec3<f32>, count: usize) -> Vec<(f32, &Entity)> {
        self.entities
            .nearest(&[point.0, point.1, point.2], count, &squared_euclidean)
            .expect("Unable to search KdTree.")
    }
}
