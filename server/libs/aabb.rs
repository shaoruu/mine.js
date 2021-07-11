#![allow(dead_code)]

use crate::utils::math::approx_equals;

use super::vec::Vec3;

#[derive(Debug, Clone, Default)]
pub struct Aabb {
    pub base: Vec3<f32>,
    pub vec: Vec3<f32>,
    pub max: Vec3<f32>,

    pub mag: f32,
}

impl Aabb {
    pub fn new(base: &Vec3<f32>, vec: &Vec3<f32>) -> Self {
        let base = base.clone();
        let vec = vec.clone();
        let max = base.add(&vec);
        let mag = (vec.0 * vec.0 + vec.1 * vec.1 + vec.2 * vec.2).sqrt();

        Self {
            base,
            vec,
            max,
            mag,
        }
    }

    pub fn width(&self) -> f32 {
        self.vec.0
    }

    pub fn height(&self) -> f32 {
        self.vec.1
    }

    pub fn depth(&self) -> f32 {
        self.vec.2
    }

    pub fn x0(&self) -> f32 {
        self.base.0
    }

    pub fn y0(&self) -> f32 {
        self.base.1
    }

    pub fn z0(&self) -> f32 {
        self.base.2
    }

    pub fn x1(&self) -> f32 {
        self.max.0
    }

    pub fn y1(&self) -> f32 {
        self.max.1
    }

    pub fn z1(&self) -> f32 {
        self.max.2
    }

    pub fn translate(&mut self, by: &Vec3<f32>) -> &Self {
        self.max = self.max.add(by);
        self.base = self.base.add(by);
        self
    }

    pub fn set_position(&mut self, pos: &Vec3<f32>) -> &Self {
        self.max = pos.add(&self.vec);
        self.base = pos.clone();
        self
    }

    pub fn expand(&mut self, aabb: &Aabb) -> Self {
        let max = aabb.max.max(&self.max);
        let min = aabb.base.min(&self.base);
        let max = max.sub(&min);

        Aabb::new(&min, &max)
    }

    pub fn intersects(&self, aabb: &Aabb) -> bool {
        if aabb.base.0 > self.max.0 {
            return false;
        }
        if aabb.base.1 > self.max.1 {
            return false;
        }
        if aabb.base.2 > self.max.2 {
            return false;
        }
        if aabb.max.0 < self.base.0 {
            return false;
        }
        if aabb.max.1 < self.base.1 {
            return false;
        }
        if aabb.max.2 < self.base.2 {
            return false;
        }
        true
    }

    pub fn touches(&self, aabb: &Aabb) -> bool {
        let intersection = self.union(aabb);
        let zero = 0.0;

        if let Some(intersection) = intersection {
            approx_equals(&intersection.width(), &zero)
                || approx_equals(&intersection.height(), &zero)
                || approx_equals(&intersection.depth(), &zero)
        } else {
            false
        }
    }

    pub fn union(&self, aabb: &Aabb) -> Option<Self> {
        if !self.intersects(aabb) {
            return None;
        }

        let base_x = aabb.base.0.max(self.base.0);
        let base_y = aabb.base.1.max(self.base.1);
        let base_z = aabb.base.2.max(self.base.2);
        let max_x = aabb.max.0.min(self.max.0);
        let max_y = aabb.max.1.min(self.max.1);
        let max_z = aabb.max.2.min(self.max.2);

        Some(Aabb::new(
            &Vec3(base_x, base_y, base_z),
            &Vec3(max_x - base_x, max_y - base_y, max_z - base_z),
        ))
    }

    pub fn copy(&mut self, other: &Aabb) -> &Self {
        for i in 0..3 {
            self.base[i] = other.base[i];
            self.max[i] = other.max[i];
            self.vec[i] = other.vec[i];
        }
        self
    }
}
