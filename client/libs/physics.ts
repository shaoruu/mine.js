import vec3 from 'gl-vec3';
import sweep from 'voxel-aabb-sweep';

import { PhysicsOptionsType } from '../core';
import { Helper } from '../utils';

import { AABB } from './aabb';
import { RigidBody } from './rigid-body';
import { BodyOptionsType } from './types';

// huge thanks to https://github.com/andyhall/voxel-physics-engine/blob/master/src/index.js

type TestFunctionType = (vx: number, vy: number, vz: number) => boolean;

class Physics {
  public bodies: RigidBody[] = [];

  private a = vec3.create();
  private dv = vec3.create();
  private dx = vec3.create();
  private impacts = vec3.create();
  private oldResting = vec3.create();
  private sleepVec = vec3.create();
  private fluidVec = vec3.create();
  private lateralVel = vec3.create();
  private tmpBox = new AABB([], []);
  private tmpResting = vec3.create();
  private targetPos = vec3.create();
  private upvec = vec3.create();
  private leftover = vec3.create();

  constructor(
    private testSolid: TestFunctionType,
    private testFluid: TestFunctionType,
    public options: PhysicsOptionsType,
  ) {}

  addBody(options: Partial<BodyOptionsType>) {
    const defaultOptions = {
      aabb: new AABB([0, 0, 0], [1, 1, 1]),
      mass: 1,
      friction: 1,
      restitution: 0,
      gravityMultiplier: 1,
      onCollide: () => {},
      autoStep: false,
    };

    const { aabb, mass, friction, restitution, gravityMultiplier, onCollide, autoStep } = {
      ...defaultOptions,
      ...options,
    };

    const b = new RigidBody(aabb, mass, friction, restitution, gravityMultiplier, onCollide, autoStep);
    this.bodies.push(b);
    return b;
  }

  removeBody(b: RigidBody) {
    const i = this.bodies.indexOf(b);
    if (i < 0) return undefined;
    this.bodies.splice(i, 1);
    // not sure if this is needed.
    // b.aabb = b.onCollide = null;
  }

  tick(dt: number) {
    const noGravity = Helper.approxEquals(0, vec3.len(this.options.gravity) ** 2);
    this.bodies.forEach((b) => this.iterateBody(b, dt, noGravity));
  }

  iterateBody(b: RigidBody, dt: number, noGravity: boolean) {
    vec3.copy(this.oldResting, b.resting);

    // treat bodies with <= mass as static
    if (b.mass <= 0) {
      vec3.set(b.velocity, 0, 0, 0);
      vec3.set(b.forces, 0, 0, 0);
      vec3.set(b.impulses, 0, 0, 0);
      return;
    }

    // skip bodies if static or no velocity/forces/impulses
    const localNoGrav = noGravity || b.gravityMultiplier === 0;
    if (this.bodyAsleep(b, dt, localNoGrav)) return;
    b.sleepFrameCount--;

    // check if under water, if so apply buoyancy and drag forces
    this.applyFluidForces(b);

    // semi-implicit Euler integration

    // a = f/m + gravity*gravityMultiplier
    vec3.scale(this.a, b.forces, 1 / b.mass);
    vec3.scaleAndAdd(this.a, this.a, this.options.gravity, b.gravityMultiplier);

    // dv = i/m + a*dt
    // v1 = v0 + dv
    vec3.scale(this.dv, b.impulses, 1 / b.mass);
    vec3.scaleAndAdd(this.dv, this.dv, this.a, dt);
    vec3.add(b.velocity, b.velocity, this.dv);

    // apply friction based on change in velocity this frame
    if (b.friction) {
      this.applyFrictionByAxis(0, b, this.dv);
      this.applyFrictionByAxis(1, b, this.dv);
      this.applyFrictionByAxis(2, b, this.dv);
    }

    // linear air or fluid friction - effectively v *= drag
    // body settings override global settings
    let drag = b.airDrag >= 0 ? b.airDrag : this.options.airDrag;
    if (b.inFluid) {
      drag = b.fluidDrag >= 0 ? b.fluidDrag : this.options.fluidDrag;
      drag *= 1 - (1 - b.ratioInFluid) ** 2;
    }
    const mult = Math.max(1 - (drag * dt) / b.mass, 0);
    vec3.scale(b.velocity, b.velocity, mult);

    // x1-x0 = v1*dt
    vec3.scale(this.dx, b.velocity, dt);

    // clear forces and impulses for next timestep
    vec3.set(b.forces, 0, 0, 0);
    vec3.set(b.impulses, 0, 0, 0);

    // cache old position for use in autostepping
    if (b.autoStep) {
      Helper.cloneAABB(this.tmpBox, b.aabb);
    }

    // sweeps aabb along dx and accounts for collisions
    this.processCollisions(b.aabb, this.dx, b.resting);

    // if autostep, and on ground, run collisions again with stepped up aabb
    if (b.autoStep) {
      this.tryAutoStepping(b, this.tmpBox, this.dx);
    }

    // Collision impacts. b.resting shows which axes had collisions:
    for (let i = 0; i < 3; ++i) {
      this.impacts[i] = 0;
      if (b.resting[i]) {
        // count impact only if wasn't collided last frame
        if (!this.oldResting[i]) this.impacts[i] = -b.velocity[i];
        b.velocity[i] = 0;
      }
    }
    const mag = vec3.len(this.impacts);
    if (mag > 0.001) {
      // epsilon
      // send collision event - allows client to optionally change
      // body's restitution depending on what terrain it hit
      // event argument is impulse J = m * dv
      vec3.scale(this.impacts, this.impacts, b.mass);
      if (b.onCollide) b.onCollide(this.impacts);

      // bounce depending on restitution and minBounceImpulse
      if (b.restitution > 0 && mag > this.options.minBounceImpulse) {
        vec3.scale(this.impacts, this.impacts, b.restitution);
        b.applyImpulse(this.impacts);
      }
    }

    // sleep check
    const vsq = vec3.len(b.velocity) ** 2;
    if (vsq > 1e-5) b.markActive();
  }

  applyFluidForces(body: RigidBody) {
    // First pass at handling fluids. Assumes fluids are settled
    //   thus, only check at corner of body, and only from bottom up
    const box = body.aabb;
    const cx = Math.floor(box.base[0]);
    const cz = Math.floor(box.base[2]);
    const y0 = Math.floor(box.base[1]);
    const y1 = Math.floor(box.max[1]);

    if (!this.testFluid(cx, y0, cz)) {
      body.inFluid = false;
      body.ratioInFluid = 0;
      return;
    }

    // body is in a fluid - find out how much of body is submerged
    let submerged = 1;
    let cy = y0 + 1;
    while (cy <= y1 && this.testFluid(cx, cy, cz)) {
      submerged++;
      cy++;
    }
    const fluidLevel = y0 + submerged;
    const heightInFluid = fluidLevel - box.base[1];
    let ratioInFluid = heightInFluid / box.vec[1];
    if (ratioInFluid > 1) ratioInFluid = 1;
    const vol = box.vec[0] * box.vec[1] * box.vec[2];
    const displaced = vol * ratioInFluid;
    // bouyant force = -gravity * fluidDensity * volumeDisplaced
    const f = this.fluidVec;
    vec3.scale(f, this.options.gravity, -this.options.fluidDensity * displaced);
    body.applyForce(f);

    body.inFluid = true;
    body.ratioInFluid = ratioInFluid;
  }

  applyFrictionByAxis(axis: number, body: RigidBody, dvel: number[]) {
    // friction applies only if moving into a touched surface
    const restDir = body.resting[axis];
    const vNormal = dvel[axis];
    if (restDir === 0) return;
    if (restDir * vNormal <= 0) return;

    // current vel lateral to friction axis
    vec3.copy(this.lateralVel, body.velocity);
    this.lateralVel[axis] = 0;
    const vCurr = vec3.len(this.lateralVel);
    if (Helper.approxEquals(vCurr, 0)) return;

    // treat current change in velocity as the result of a pseudoforce
    //        Fpseudo = m*dv/dt
    // Base friction force on normal component of the pseudoforce
    //        Ff = u * Fnormal
    //        Ff = u * m * dvnormal / dt
    // change in velocity due to friction force
    //        dvF = dt * Ff / m
    //            = dt * (u * m * dvnormal / dt) / m
    //            = u * dvnormal
    const dvMax = Math.abs(body.friction * vNormal);

    // decrease lateral vel by dvMax (or clamp to zero)
    const scaler = vCurr > dvMax ? (vCurr - dvMax) / vCurr : 0;
    body.velocity[(axis + 1) % 3] *= scaler;
    body.velocity[(axis + 2) % 3] *= scaler;
  }

  processCollisions(box: AABB, velocity: number[], resting: number[]) {
    vec3.set(resting, 0, 0, 0);
    return sweep(this.testSolid, box, velocity, function (_: never, axis: number, dir: number, vec: number[]) {
      resting[axis] = dir;
      vec[axis] = 0;
    });
  }

  tryAutoStepping(b: RigidBody, oldBox: AABB, dx: number[]) {
    if (b.resting[1] >= 0 && !b.inFluid) return;

    // // direction movement was blocked before trying a step
    const xBlocked = b.resting[0] !== 0;
    const zBlocked = b.resting[2] !== 0;
    if (!(xBlocked || zBlocked)) return;

    // continue autostepping only if headed sufficiently into obstruction
    const ratio = Math.abs(dx[0] / dx[2]);
    const cutoff = 4;
    if (!xBlocked && ratio > cutoff) return;
    if (!zBlocked && ratio < 1 / cutoff) return;

    // original target position before being obstructed
    vec3.add(this.targetPos, oldBox.base, dx);

    // move towards the target until the first X/Z collision
    const getVoxels = this.testSolid;
    sweep(getVoxels, oldBox, dx, function (_: never, axis: number, dir: number, vec: number[]) {
      if (axis === 1) vec[axis] = 0;
      else return true;
    });

    const y = b.aabb.base[1];
    const ydist = Math.floor(y + 1.001) - y;
    vec3.set(this.upvec, 0, ydist, 0);
    let collided = false;
    // sweep up, bailing on any obstruction
    sweep(getVoxels, oldBox, this.upvec, function () {
      collided = true;
      return true;
    });
    if (collided) return; // could't move upwards

    // now move in X/Z however far was left over before hitting the obstruction
    vec3.sub(this.leftover, this.targetPos, oldBox.base);
    this.leftover[1] = 0;
    this.processCollisions(oldBox, this.leftover, this.tmpResting);

    // bail if no movement happened in the originally blocked direction
    if (xBlocked && !Helper.approxEquals(oldBox.base[0], this.targetPos[0])) return;
    if (zBlocked && !Helper.approxEquals(oldBox.base[2], this.targetPos[2])) return;

    // done - oldBox is now at the target autostepped position
    Helper.cloneAABB(b.aabb, oldBox);
    b.resting[0] = this.tmpResting[0];
    b.resting[2] = this.tmpResting[2];
    if (b.onStep) b.onStep();
  }

  bodyAsleep(body: RigidBody, dt: number, noGravity: boolean) {
    if (body.sleepFrameCount > 0) return false;

    // without gravity bodies stay asleep until a force/impulse wakes them up
    if (noGravity) return true;

    // otherwise check body is resting against something
    // i.e. sweep along by distance d = 1/2 g*t^2
    // and check there's still a collision
    let isResting = false;
    const gmult = 0.5 * dt * dt * body.gravityMultiplier;
    vec3.scale(this.sleepVec, this.options.gravity, gmult);

    sweep(
      this.testSolid,
      body.aabb,
      this.sleepVec,
      function () {
        isResting = true;
        return true;
      },
      true,
    );

    return isResting;
  }
}

export { Physics };
