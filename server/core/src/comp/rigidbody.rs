use specs::{Component, Entity, Storage, VecStorage};

use server_common::{aabb::Aabb, vec::Vec3};

#[derive(Default, Component)]
#[storage(VecStorage)]
pub struct RigidBody {
    // flags for test
    pub collided: Option<Vec3<f32>>,
    pub stepped: bool,

    pub aabb: Aabb,
    pub mass: f32,
    pub head: Vec3<f32>,
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
    /// Create a physical body
    ///
    /// * `aabb` - AABB hit box of rigid body
    /// * `head` - offset from AABB base to head
    /// * `mass` - mass of rigid body
    /// * `friction` - friction of rigid body
    /// * `restitution` - restitution of rigid body
    /// * `gravity_multiplier` - gravity multiplier of rigid body
    /// * `auto_step` - whether or not if body auto steps
    ///
    /// Panics if `head` has greater length than `aabb`'s dimensions
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        aabb: Aabb,
        head: &Vec3<f32>,
        mass: f32,
        friction: f32,
        restitution: f32,
        gravity_multiplier: f32,
        auto_step: bool,
    ) -> Self {
        assert!(head.len() < aabb.vec.len());

        Self {
            collided: None,
            stepped: false,

            aabb,
            head: head.to_owned(),
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

    /// Moving the rigid body by the head
    pub fn set_head_position(&mut self, p: &Vec3<f32>) {
        self.set_position(p);
        let head = self.head.scale(-1.0);
        self.aabb.translate(&head);
        self.mark_active();
    }

    /// Setter for rigid body's position
    pub fn set_position(&mut self, p: &Vec3<f32>) {
        let delta = p.sub(&self.aabb.base);
        self.aabb.translate(&delta);
        self.mark_active();
    }

    /// Getter for rigid body's head position
    pub fn get_head_position(&self) -> Vec3<f32> {
        self.aabb.base.clone().add(&self.head)
    }

    /// Getter for rigid body's position
    pub fn get_position(&self) -> Vec3<f32> {
        self.aabb.base.clone()
    }

    /// Adds a vector to rigid body's internal force, which gets
    /// processed every tick.
    pub fn apply_force(&mut self, f: &Vec3<f32>) {
        self.forces = self.forces.add(f);
        self.mark_active();
    }

    /// Adds a vector to rigid body's internal impulse, which gets
    /// processed every tick.
    pub fn apply_impulse(&mut self, i: &Vec3<f32>) {
        self.impulses = self.impulses.add(i);
        self.mark_active();
    }

    /// Get x-axis of the resting vector of a rigid body. A resting
    /// vector indicates whether a body is resting or not.
    pub fn at_rest_x(&self) -> f32 {
        self.resting[0]
    }

    /// Get y-axis of the resting vector of a rigid body. A resting
    /// vector indicates whether a body is resting or not.
    pub fn at_rest_y(&self) -> f32 {
        self.resting[1]
    }

    /// Get z-axis of the resting vector of a rigid body. A resting
    /// vector indicates whether a body is resting or not.
    pub fn at_rest_z(&self) -> f32 {
        self.resting[2]
    }

    /// Mark rigid body as active. Active bodies will be processed for
    /// physics each tick.
    pub fn mark_active(&mut self) {
        self.sleep_frame_count = 10 | 0;
    }
}
