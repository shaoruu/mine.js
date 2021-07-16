use specs::{Component, VecStorage};

use server_common::{aabb::Aabb, vec::Vec3};

#[derive(Default)]
pub struct RigidBody {
    // flags for test
    pub collided: Option<Vec3<f32>>,
    pub stepped: bool,

    pub aabb: Aabb,
    pub mass: f32,
    pub friction: f32,
    pub restitution: f32,
    pub gravity_multiplier: f32,
    pub auto_step: bool,

    pub air_drag: f32,
    pub fluid_drag: f32,

    pub resting: Vec3<f32>,
    pub velocity: Vec3<f32>,
    pub in_fluid: bool,
    pub ratio_in_fluid: f32,
    pub forces: Vec3<f32>,
    pub impulses: Vec3<f32>,
    pub sleep_frame_count: i32,
}

impl RigidBody {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        aabb: Aabb,
        mass: f32,
        friction: f32,
        restitution: f32,
        gravity_multiplier: f32,
        auto_step: bool,
    ) -> Self {
        Self {
            collided: None,
            stepped: false,

            aabb,
            mass,
            friction,
            restitution,
            gravity_multiplier,
            auto_step,

            air_drag: -1.0,
            fluid_drag: -1.0,

            resting: Vec3::default(),
            velocity: Vec3::default(),
            in_fluid: false,
            ratio_in_fluid: 0.0,
            forces: Vec3::default(),
            impulses: Vec3::default(),
            sleep_frame_count: 10,
        }
    }

    pub fn set_position(&mut self, p: &Vec3<f32>) {
        let delta = p.sub(&self.aabb.base);
        self.aabb.translate(&delta);
        self.mark_active();
    }

    pub fn get_position(&self) -> Vec3<f32> {
        self.aabb.base.clone()
    }

    pub fn apply_force(&mut self, f: &Vec3<f32>) {
        self.forces = self.forces.add(f);
        self.mark_active();
    }

    pub fn apply_impulse(&mut self, i: &Vec3<f32>) {
        self.impulses = self.impulses.add(i);
        self.mark_active();
    }

    pub fn at_rest_x(&self) -> f32 {
        self.resting[0]
    }

    pub fn at_rest_y(&self) -> f32 {
        self.resting[1]
    }

    pub fn at_rest_z(&self) -> f32 {
        self.resting[2]
    }

    pub fn mark_active(&mut self) {
        self.sleep_frame_count = 10 | 0;
    }
}

impl Component for RigidBody {
    type Storage = VecStorage<Self>;
}
