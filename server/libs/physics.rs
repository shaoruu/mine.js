#![allow(dead_code)]

use std::sync::{Arc, Mutex};

use crate::{
    core::engine::chunks::Chunks,
    utils::{math::approx_equals, sweep::sweep},
};

use super::{aabb::Aabb, rigidbody::RigidBody, types::Vec3};

type TestFunction<'a> = &'a dyn Fn(i32, i32, i32) -> bool;

pub struct BodyOptions<'a> {
    pub aabb: Aabb,
    pub mass: f32,
    pub friction: f32,
    pub restitution: f32,
    pub gravity_multiplier: f32,
    pub on_collide: Option<&'a mut dyn FnMut(Vec3<f32>)>,
    pub auto_step: bool,
}

#[derive(Clone, Default)]
pub struct PhysicsOptions {
    pub gravity: Vec3<f32>,
    pub min_bounce_impulse: f32,
    pub air_drag: f32,
    pub fluid_drag: f32,
    pub fluid_density: f32,
}

#[derive(Default)]
pub struct Physics {
    options: PhysicsOptions,
}

impl Physics {
    pub fn new(options: PhysicsOptions) -> Self {
        Self { options }
    }

    pub fn iterate_body(&self, b: &mut RigidBody, dt: f32, chunks: &Chunks) {
        let test_solid = |x: i32, y: i32, z: i32| -> bool { chunks.get_solidity_by_voxel(x, y, z) };
        let test_fluid = |_, _, _| false;

        let no_gravity = approx_equals(&0.0, &self.options.gravity.len().powi(2));

        // reset flags
        b.collided = None;
        b.stepped = false;

        let old_resting = &b.resting.clone();

        // treat bodies with <= 0 mass as static
        if b.mass <= 0.0 {
            b.velocity.set(0.0, 0.0, 0.0);
            b.forces.set(0.0, 0.0, 0.0);
            b.impulses.set(0.0, 0.0, 0.0);
            return;
        }

        // skip bodies if static or no velocity/forces/impulses
        let local_no_grav = no_gravity || approx_equals(&b.gravity_multiplier, &0.0);
        if self.body_asleep(b, &dt, &local_no_grav, &test_solid) {
            return;
        }
        b.sleep_frame_count -= 1;

        // check if under water, if so apply buoyancy and drag forces
        self.apply_fluid_forces(b, &test_fluid);

        // semi-implicit Euler integration

        // a = f/m + gravity * gravity_multiplier
        let a = b
            .forces
            .scale(1.0 / b.mass)
            .scale_and_add(&self.options.gravity, b.gravity_multiplier);

        // dv = i/m + a*dt
        // v1 = v0 + dv
        let dv = b.impulses.scale(1.0 / b.mass);
        let dv = dv.scale_and_add(&a, dt);
        b.velocity = b.velocity.add(&dv);

        // apply friction based on change in velocity this frame
        if !approx_equals(&b.friction, &0.0) {
            self.apply_friction_by_axis(0, b, &dv);
            self.apply_friction_by_axis(1, b, &dv);
            self.apply_friction_by_axis(2, b, &dv);
        }

        // linear air or fluid friction - effectively v *= drag;
        // body settings override global settings
        let mut drag = if b.air_drag >= 0.0 {
            b.air_drag
        } else {
            self.options.air_drag
        };
        if b.in_fluid {
            drag = if b.fluid_drag >= 0.0 {
                b.fluid_drag
            } else {
                self.options.fluid_drag
            };
            drag *= 1.0 - (1.0 - b.ratio_in_fluid).powi(2);
        }
        let mult = (1.0 - (drag * dt) / b.mass).max(0.0);
        b.velocity = b.velocity.scale(mult);

        // x1-x0 = v1*dt
        let dx = b.velocity.scale(dt);

        // clear forces and impulses for next timestep
        b.forces.set(0.0, 0.0, 0.0);
        b.impulses.set(0.0, 0.0, 0.0);

        // cache old position for use in autostepping
        let tmp_box = if b.auto_step {
            Some(b.aabb.clone())
        } else {
            None
        };

        // sweeps aabb along dx and accounts for collisions
        self.process_collisions(&mut b.aabb, &dx, &mut b.resting, &test_solid);

        // if autostep, and on ground, run collisions again with stepped up aabb
        if b.auto_step {
            let mut tmp_box = tmp_box.unwrap();
            self.try_auto_stepping(b, &mut tmp_box, &dx, &test_solid);
        }

        let mut impacts = Vec3::default();

        // collision impacts. b.resting shows which axes had collisions
        for i in 0..3 {
            impacts[i] = 0.0;
            if !approx_equals(&b.resting[i], &0.0) {
                // count impact only if wasn't collided last frame
                if approx_equals(&old_resting[i], &0.0) {
                    impacts[i] = -b.velocity[i];
                }
                b.velocity[i] = 0.0;
            }
        }

        let mag = impacts.len();
        if mag > 0.001 {
            // epsilon
            // send collision event - allow player to optionally change
            // body's restitution depending on what terrain it hit
            // event argument is impulse J = m * dv
            impacts = impacts.scale(b.mass);
            b.collided = Some(impacts.clone());

            // bounce depending on restitution and min_bounce_impulse
            if b.restitution > 0.0 && mag > self.options.min_bounce_impulse {
                impacts = impacts.scale(b.restitution);
                b.apply_impulse(&impacts);
            }
        }

        // sleep check
        let vsq = b.velocity.len().powi(2);
        if vsq > 1e-5 {
            b.mark_active()
        }
    }

    fn apply_fluid_forces(&self, body: &mut RigidBody, test_fluid: TestFunction) {
        let aabb = &body.aabb;
        let cx = aabb.base[0].floor() as i32;
        let cz = aabb.base[2].floor() as i32;
        let y0 = aabb.base[1].floor() as i32;
        let y1 = aabb.max[1].floor() as i32;

        if !test_fluid(cx, y0, cz) {
            body.in_fluid = false;
            body.ratio_in_fluid = 0.0;
            return;
        }

        // body is in fluid - find out how much of body is submerged
        let mut submerged = 1;
        let mut cy = y0 + 1;
        while cy <= y1 && test_fluid(cx, cy, cz) {
            submerged += 1;
            cy += 1;
        }
        let fluid_level = y0 + submerged;
        let height_in_fluid = fluid_level as f32 - aabb.base[1];
        let mut ratio_in_fluid = height_in_fluid / aabb.vec[1];
        if ratio_in_fluid > 1.0 {
            ratio_in_fluid = 1.0;
        }
        let vol = aabb.vec[0] * aabb.vec[1] * aabb.vec[2];
        let displaced = vol * ratio_in_fluid;
        // buoyant force = -gravity * fluid_density * volume_displaced
        let fluid_vec = self
            .options
            .gravity
            .scale(-self.options.fluid_density * displaced);
        body.apply_force(&fluid_vec);

        body.in_fluid = true;
        body.ratio_in_fluid = ratio_in_fluid;
    }

    fn apply_friction_by_axis(&self, axis: usize, body: &mut RigidBody, dvel: &Vec3<f32>) {
        // friction applies only if moving into a touched surface
        let rest_dir = body.resting[axis];
        let v_normal = dvel[axis];
        if approx_equals(&rest_dir, &0.0) || rest_dir * v_normal <= 0.0 {
            return;
        }

        // current vel lateral to friction axis
        let mut lateral_vel = body.velocity.clone();
        lateral_vel[axis] = 0.0;
        let v_curr = lateral_vel.len();
        if approx_equals(&v_curr, &0.0) {
            return;
        }

        // treat current change in velocity as the result of a pseudoforce
        //        Fpseudo = m*dv/dt
        // Base friction force on normal component of the pseudoforce
        //        Ff = u * Fnormal
        //        Ff = u * m * dvnormal / dt
        // change in velocity due to friction force
        //        dvF = dt * Ff / m
        //            = dt * (u * m * dvnormal / dt) / m
        //            = u * dvnormal
        let dv_max = (body.friction * v_normal).abs();

        // decrease lateral vel by dv_max (or clamp to zero)
        let scaler = if v_curr > dv_max {
            (v_curr - dv_max) / v_curr
        } else {
            0.0
        };

        body.velocity[(axis + 1) % 3] *= scaler;
        body.velocity[(axis + 2) % 3] *= scaler;
    }

    fn process_collisions(
        &self,
        aabb: &mut Aabb,
        velocity: &Vec3<f32>,
        resting: &mut Vec3<f32>,
        test_solid: TestFunction,
    ) -> f32 {
        resting.set(0.0, 0.0, 0.0);

        // temporarily set axis to something impossible, just for safety
        let d = Arc::new(Mutex::new((10, 0)));
        let temp = d.clone();

        let dist = sweep(
            test_solid,
            aabb,
            velocity,
            &mut move |_, axis: usize, dir: i32, vec: &mut Vec3<f32>| {
                *temp.lock().unwrap() = (axis, dir);
                vec[axis] = 0.0;
                false
            },
            false,
        );

        let (axis, dir) = *d.lock().unwrap();
        if axis != 10 {
            resting[axis] = dir as f32;
        }

        dist
    }

    fn try_auto_stepping(
        &self,
        b: &mut RigidBody,
        old_aabb: &mut Aabb,
        dx: &Vec3<f32>,
        test_solid: TestFunction,
    ) {
        // in the air
        if b.resting[1] >= 0.0 && !b.in_fluid {
            return;
        }

        // direction movement was blocked before trying a step
        let x_blocked = !approx_equals(&b.resting[0], &0.0);
        let z_blocked = !approx_equals(&b.resting[2], &0.0);
        if !(x_blocked || z_blocked) {
            return;
        }

        // continue auto-stepping only if headed sufficiently into obstruction
        let ratio = (dx[0] / dx[2]).abs();
        let cutoff = 4.0;
        if !x_blocked && ratio > cutoff || !z_blocked && ratio < 1.0 / cutoff {
            return;
        }

        // original target position before being obstructed
        let target_pos = old_aabb.base.add(&dx);

        // move towards the target until the first x/z collision
        sweep(
            test_solid,
            old_aabb,
            dx,
            &mut move |_, axis, _, vec| {
                if axis == 1 {
                    vec[axis] = 0.0;
                    return false;
                }
                true
            },
            false,
        );

        let y = b.aabb.base[1];
        let y_dist = (y + 1.001).floor() - y;
        let upvec = Vec3(0.0, y_dist, 0.0);
        let collided = Arc::new(Mutex::new(false));
        let temp = collided.clone();
        sweep(
            test_solid,
            old_aabb,
            &upvec,
            &mut move |_, _, _, _| {
                *temp.lock().unwrap() = true;
                true
            },
            false,
        );
        if *collided.lock().unwrap() {
            return;
        }

        // now move in x/z however far was left over before hitting the obstruction
        let mut leftover = target_pos.sub(&old_aabb.base);
        leftover[1] = 0.0;
        let mut tmp_resting = Vec3::default();
        self.process_collisions(old_aabb, &leftover, &mut tmp_resting, test_solid);

        // bail if no movement happened in the originally blocked direction
        if x_blocked && !approx_equals(&old_aabb.base[0], &target_pos[0]) {
            return;
        }
        if z_blocked && !approx_equals(&old_aabb.base[2], &target_pos[2]) {
            return;
        }

        // done - oldBox is now at the target auto-stepped position
        b.aabb.copy(old_aabb);
        b.resting[0] = tmp_resting[0];
        b.resting[2] = tmp_resting[2];
        b.stepped = true;
    }

    fn body_asleep(
        &self,
        body: &mut RigidBody,
        dt: &f32,
        no_gravity: &bool,
        test_solid: TestFunction,
    ) -> bool {
        if body.sleep_frame_count > 0 {
            return false;
        }

        // without gravity bodies stay asleep until a force/impulse wakes them up
        if *no_gravity {
            return true;
        }

        // otherwise check body is resting against something
        // i.e. sweep along by distance d = 1/2 g*t^2
        // and check there's still collision
        let g_mult = 0.5 * dt * dt * body.gravity_multiplier;
        let sleep_vec = self.options.gravity.scale(g_mult);

        let is_resting = Arc::new(Mutex::new(false));
        let temp = is_resting.clone();

        sweep(
            test_solid,
            &mut body.aabb,
            &sleep_vec,
            &mut move |_, _, _, _| {
                *temp.lock().unwrap() = true;
                true
            },
            true,
        );

        let result = *is_resting.lock().unwrap();
        result
    }
}
