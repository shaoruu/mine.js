#![allow(clippy::too_many_arguments)]

use server_common::{aabb::Aabb, math::approx_equals, types::GetVoxel, vec::Vec3};

const EPSILON: f32 = 1e-10;

type SweepCallback = dyn FnMut(f32, usize, i32, &mut Vec3<f32>) -> bool;

fn lead_edge_to_int(coord: f32, step: i32) -> i32 {
    (coord - step as f32 * EPSILON).floor() as i32
}

fn trail_edge_to_int(coord: f32, step: i32) -> i32 {
    (coord + step as f32 * EPSILON).floor() as i32
}

// low-level implementations of each step:
fn init_sweep(
    t: &mut f32,
    max_t: &mut f32,
    vec: &mut Vec3<f32>,
    step: &mut Vec3<i32>,
    max: &Vec3<f32>,
    base: &Vec3<f32>,
    tr: &mut Vec3<f32>,
    ldi: &mut Vec3<i32>,
    tri: &mut Vec3<i32>,
    normed: &mut Vec3<f32>,
    t_delta: &mut Vec3<f32>,
    t_next: &mut Vec3<f32>,
) {
    // parametrization t along raycast
    *t = 0.0;
    *max_t = (vec.0 * vec.0 + vec.1 * vec.1 + vec.2 * vec.2).sqrt();

    if approx_equals(&max_t, &0.0) {
        return;
    }

    for i in 0..3 {
        let dir = vec[i] >= 0.0;
        step[i] = if dir { 1 } else { -1 };
        // trailing / trailing edge coords
        let lead = if dir { max[i] } else { base[i] };
        tr[i] = if dir { base[i] } else { max[i] };
        // int values of lead/trail edges
        ldi[i] = lead_edge_to_int(lead, step[i]);
        tri[i] = trail_edge_to_int(tr[i], step[i]);
        // normed vector
        normed[i] = vec[i] / *max_t;
        // distance along t required to move one voxel in each axis
        t_delta[i] = (1.0 / normed[i]).abs();
        // location of nearest voxel boundary, in units of t
        let dist = if dir {
            ldi[i] as f32 + 1.0 - lead
        } else {
            lead - ldi[i] as f32
        };
        t_next[i] = if t_delta[i] < f32::MAX {
            t_delta[i] * dist
        } else {
            f32::MAX
        };
    }
}

fn check_collisions(
    i_axis: usize,
    get_voxel: GetVoxel,
    step: &Vec3<i32>,
    ldi: &Vec3<i32>,
    tri: &Vec3<i32>,
) -> bool {
    let step_x = step[0];
    let x0 = if i_axis == 0 { ldi[0] } else { tri[0] };
    let x1 = ldi[0] + step_x;

    let step_y = step[1];
    let y0 = if i_axis == 1 { ldi[1] } else { tri[1] };
    let y1 = ldi[1] + step_y;

    let step_z = step[2];
    let z0 = if i_axis == 2 { ldi[2] } else { tri[2] };
    let z1 = ldi[2] + step_z;

    let mut x = x0;
    while x != x1 {
        let mut y = y0;
        while y != y1 {
            let mut z = z0;
            while z != z1 {
                if get_voxel(x, y, z) {
                    return true;
                }
                z += step_z;
            }
            y += step_y;
        }
        x += step_x;
    }

    false
}

fn handle_collision(
    axis: usize,
    cumulative_t: &mut f32,
    callback: &mut SweepCallback,
    t: &mut f32,
    max_t: &mut f32,
    vec: &mut Vec3<f32>,
    step: &mut Vec3<i32>,
    max: &mut Vec3<f32>,
    base: &mut Vec3<f32>,
    tr: &mut Vec3<f32>,
    ldi: &mut Vec3<i32>,
    tri: &mut Vec3<i32>,
    normed: &mut Vec3<f32>,
    t_delta: &mut Vec3<f32>,
    t_next: &mut Vec3<f32>,
) -> bool {
    // setup for callback
    *cumulative_t += *t;
    let dir = step[axis];

    // vector moved so far, and left to move
    let done = *t / *max_t;
    let mut left = Vec3::default();
    for i in 0..3 {
        let dv = vec[i] * done;
        base[i] += dv;
        max[i] += dv;
        left[i] = vec[i] - dv;
    }

    // set leading edge of stepped axis exactly to voxel boundary
    // else we'll sometimes rounding error beyond it
    if dir > 0 {
        max[axis] = max[axis].round();
    } else {
        base[axis] = base[axis].round();
    }

    // call back to let player update the "left to go" vector
    let res = callback(*cumulative_t, axis, dir, &mut left);

    // bail out on truthy response
    if res {
        return true;
    }

    // init for new sweep along vec
    for i in 0..3 {
        vec[i] = left[i];
    }

    init_sweep(
        t, max_t, vec, step, max, base, tr, ldi, tri, normed, t_delta, t_next,
    );

    if *max_t == 0.0 {
        // no vector left
        return true;
    }

    false
}

fn step_forward(
    t: &mut f32,
    step: &mut Vec3<i32>,
    tr: &mut Vec3<f32>,
    ldi: &mut Vec3<i32>,
    tri: &mut Vec3<i32>,
    normed: &mut Vec3<f32>,
    t_delta: &mut Vec3<f32>,
    t_next: &mut Vec3<f32>,
) -> usize {
    let axis = if t_next[0] < t_next[1] {
        if t_next[0] < t_next[2] {
            0
        } else {
            2
        }
    } else if t_next[1] < t_next[2] {
        1
    } else {
        2
    };

    let dt = t_next[axis] - *t;
    *t = t_next[axis];
    ldi[axis] += step[axis];
    t_next[axis] += t_delta[axis];

    for i in 0..3 {
        tr[i] += dt * normed[i];
        tri[i] = trail_edge_to_int(tr[i], step[i]);
    }

    axis
}

fn do_sweep(
    get_voxel: GetVoxel,
    callback: &mut SweepCallback,
    vec: &mut Vec3<f32>,
    base: &mut Vec3<f32>,
    max: &mut Vec3<f32>,
) -> f32 {
    let mut tr = Vec3::default();
    let mut ldi = Vec3::default();
    let mut tri = Vec3::default();
    let mut step = Vec3::default();
    let mut t_delta = Vec3::default();
    let mut t_next = Vec3::default();
    let mut normed = Vec3::default();

    let mut cumulative_t = 0.0;
    let mut t = 0.0;
    let mut max_t = 0.0;
    let mut axis: usize;

    init_sweep(
        &mut t,
        &mut max_t,
        vec,
        &mut step,
        max,
        base,
        &mut tr,
        &mut ldi,
        &mut tri,
        &mut normed,
        &mut t_delta,
        &mut t_next,
    );

    if max_t == 0.0 {
        return 0.0;
    }

    axis = step_forward(
        &mut t,
        &mut step,
        &mut tr,
        &mut ldi,
        &mut tri,
        &mut normed,
        &mut t_delta,
        &mut t_next,
    );

    while t <= max_t {
        if check_collisions(axis, get_voxel, &step, &ldi, &tri) {
            let done = handle_collision(
                axis,
                &mut cumulative_t,
                callback,
                &mut t,
                &mut max_t,
                vec,
                &mut step,
                max,
                base,
                &mut tr,
                &mut ldi,
                &mut tri,
                &mut normed,
                &mut t_delta,
                &mut t_next,
            );

            if done {
                return cumulative_t;
            }
        }

        axis = step_forward(
            &mut t,
            &mut step,
            &mut tr,
            &mut ldi,
            &mut tri,
            &mut normed,
            &mut t_delta,
            &mut t_next,
        );
    }

    cumulative_t += max_t;

    for i in 0..3 {
        base[i] += vec[i];
        max[i] += vec[i];
    }

    cumulative_t
}

pub fn sweep(
    get_voxel: GetVoxel,
    aabb: &mut Aabb,
    dir: &Vec3<f32>,
    callback: &mut SweepCallback,
    no_translate: bool,
) -> f32 {
    let mut vec = dir.clone();
    let mut max = aabb.max.clone();
    let mut base = aabb.base.clone();
    let mut result = Vec3::default();

    let dist = do_sweep(get_voxel, callback, &mut vec, &mut base, &mut max);

    if !no_translate {
        for i in 0..3 {
            result[i] = if dir[i] > 0.0 {
                max[i] - aabb.max[i]
            } else {
                base[i] - aabb.base[i]
            };
        }

        aabb.translate(&result);
    }

    dist
}

#[cfg(test)]
mod tests {
    use std::sync::{Arc, Mutex};

    use super::*;

    #[test]
    fn basics() {
        let get_voxels = |_: i32, _: i32, _: i32| false;
        let mut aabb = Aabb::new(&Vec3(0.25, 0.25, 0.25), &Vec3(0.5, 0.5, 0.5));
        let dir = Vec3(0.0, 0.0, 0.0);
        let collided = Arc::new(Mutex::new(false));
        let test = collided.clone();

        let mut callback = move |t: f32, axis: usize, dir: i32, vec: &mut Vec3<f32>| {
            *test.lock().unwrap() = true;
            true
        };

        let res = sweep(&get_voxels, &mut aabb, &dir, &mut callback, false);
        assert!(!*collided.lock().unwrap());
        assert!(
            (res - 0.0).abs() < f32::EPSILON,
            "No movement with empty vector 1"
        );
        assert!(
            (aabb.base[0] - 0.25).abs() < f32::EPSILON,
            "No movement with empty vector 2"
        );
        assert!(
            (aabb.base[1] - 0.25).abs() < f32::EPSILON,
            "No movement with empty vector 3"
        );
        assert!(
            (aabb.base[2] - 0.25).abs() < f32::EPSILON,
            "No movement with empty vector 4"
        );

        let dir = Vec3(10.0, -5.0, -15.0);
        aabb.set_position(&Vec3(0.25, 0.25, 0.25));
        *collided.lock().unwrap() = false;
        let res = sweep(&get_voxels, &mut aabb, &dir, &mut callback, false);
        assert!(!*collided.lock().unwrap());
        assert!(
            (res - ((100.0 + 25.0 + 225.0) as f32).sqrt()).abs() < f32::EPSILON,
            "Full movement through empty voxels 1"
        );
        assert!(
            (aabb.base[0] - 0.25 - dir[0]).abs() < f32::EPSILON,
            "Full movement through empty voxels 2"
        );
        assert!(
            (aabb.base[1] - 0.25 - dir[1]).abs() < f32::EPSILON,
            "Full movement through empty voxels 3"
        );
        assert!(
            (aabb.base[2] - 0.25 - dir[2]).abs() < f32::EPSILON,
            "Full movement through empty voxels 4"
        );

        let get_voxels = |_: i32, _: i32, _: i32| true;
        let dir = Vec3(0.0, 0.0, 0.0);
        aabb.set_position(&Vec3(0.25, 0.25, 0.25));
        *collided.lock().unwrap() = false;
        let res = sweep(&get_voxels, &mut aabb, &dir, &mut callback, false);
        assert!(
            !*collided.lock().unwrap(),
            "No collision not moving through full voxels 1"
        );
        assert!(
            (res - 0.0).abs() < f32::EPSILON,
            "No collision not moving through full voxels 2"
        );

        let dir = Vec3(1.0, 0.0, 0.0);
        aabb.set_position(&Vec3(0.25, 0.25, 0.25));
        *collided.lock().unwrap() = false;
        let res = sweep(&get_voxels, &mut aabb, &dir, &mut callback, false);
        assert!(*collided.lock().unwrap());
        assert!(
            (res - 0.25).abs() < f32::EPSILON,
            "Collision moving through full voxels 1"
        );
        assert!(
            (aabb.base[0] - 0.5).abs() < f32::EPSILON,
            "Collision moving through full voxels 2"
        );
        assert!(
            (aabb.base[1] - 0.25).abs() < f32::EPSILON,
            "Collision moving through full voxels 3"
        );
        assert!(
            (aabb.base[2] - 0.25).abs() < f32::EPSILON,
            "Collision moving through full voxels 3"
        );

        let mut aabb = Aabb::new(&Vec3(0.0, 0.0, 0.0), &Vec3(10.0, 10.0, 10.0));
        let dir = Vec3(0.0, 5.0, 0.0);
        let get_voxels = |x: i32, y: i32, z: i32| x == 8 && z == 8 && y == 13;
        *collided.lock().unwrap() = false;
        let res = sweep(&get_voxels, &mut aabb, &dir, &mut callback, false);
        assert!(*collided.lock().unwrap());
        assert!(
            (res - 3.0).abs() < f32::EPSILON,
            "Big box collides with single voxel 1"
        );
        assert!(
            (aabb.base[0] - 0.0).abs() < f32::EPSILON,
            "Big box collides with single voxel 2"
        );
        assert!(
            (aabb.base[1] - 3.0).abs() < f32::EPSILON,
            "Big box collides with single voxel 3"
        );
        assert!(
            (aabb.base[2] - 0.0).abs() < f32::EPSILON,
            "Big box collides with single voxel 4"
        );
    }
}
