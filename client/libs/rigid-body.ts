import vec3 from 'gl-vec3';

import { AABB } from './aabb';

// massive thanks to https://github.com/andyhall/voxel-physics-engine/blob/master/src/rigidBody.js

class RigidBody {
  public airDrag: number;
  public fluidDrag: number;
  public onStep: null | (() => void);

  public resting = vec3.fromValues(0, 0, 0);
  public velocity = vec3.create();
  public inFluid = false;
  public ratioInFluid = 0;
  public forces = vec3.create();
  public impulses = vec3.create();
  public sleepFrameCount = 10 | 0;

  constructor(
    public aabb: AABB,
    public mass: number,
    public friction: number,
    public restitution: number,
    public gravityMultiplier: number,
    public onCollide: (impacts?: number[]) => void,
    public autoStep: boolean,
  ) {
    this.airDrag = -1;
    this.fluidDrag = -1;
    this.onStep = null;
  }

  setPosition(p: number[]) {
    vec3.sub(p, p, this.aabb.base);
    this.aabb.translate(p);
    this.markActive();
  }

  getPosition() {
    return vec3.clone(this.aabb.base);
  }

  applyForce(f: number[]) {
    vec3.add(this.forces, this.forces, f);
    this.markActive();
  }

  applyImpulse(i: number[]) {
    vec3.add(this.impulses, this.impulses, i);
    this.markActive();
  }

  markActive() {
    this.sleepFrameCount = 10 | 0;
  }

  get atRestX() {
    return this.resting[0];
  }

  get atRestY() {
    return this.resting[1];
  }

  get atRestZ() {
    return this.resting[2];
  }
}

export { RigidBody };
