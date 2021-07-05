use super::{aabb::Aabb, types::Vec3};

pub struct RigidBody<'a> {
    pub aabb: Aabb,
    pub mass: f32,
    pub friction: f32,
    pub restitution: f32,
    pub gravity_multiplier: f32,
    pub on_collide: &'a dyn FnMut(Vec<f32>),
    pub auto_step: bool,

    pub air_drag: f32,
    pub fluid_drag: f32,
    pub on_step: Option<&'a dyn FnMut()>,

    pub resting: Vec3<f32>,
    pub velocity: Vec3<f32>,
    pub in_fluid: bool,
    pub ratio_in_fluid: f32,
    pub forces: Vec3<f32>,
    pub impulses: Vec3<f32>,
    pub sleep_frame_count: i32,
}

impl<'a> RigidBody<'a> {
    pub fn new(
        aabb: Aabb,
        mass: f32,
        friction: f32,
        restitution: f32,
        gravity_multiplier: f32,
        on_collide: &'a dyn FnMut(Vec<f32>),
        auto_step: bool,
    ) -> Self {
        RigidBody {
            aabb,
            mass,
            friction,
            restitution,
            gravity_multiplier,
            on_collide,
            auto_step,

            air_drag: -1.0,
            fluid_drag: -1.0,
            on_step: None,

            resting: Vec3::default(),
            velocity: Vec3::default(),
            in_fluid: false,
            ratio_in_fluid: 0.0,
            forces: Vec3::default(),
            impulses: Vec3::default(),
            sleep_frame_count: 10 | 0,
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

    fn mark_active(&mut self) {
        self.sleep_frame_count = 10 | 0;
    }
}
