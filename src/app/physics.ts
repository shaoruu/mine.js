import { Object3D, Vector3 } from 'three';

import { Engine } from '..';
import { Physics as PhysicsCore, RigidBody } from '../libs';

type PhysicsOptionsType = {
  gravity: [number, number, number];
  minBounceImpulse: number;
  airDrag: number;
  fluidDrag: number;
  fluidDensity: number;
};

const defaultPhysicsOptions: PhysicsOptionsType = {
  gravity: [0, -20, 0],
  minBounceImpulse: 0.5,
  airDrag: 0.1,
  fluidDrag: 0.4,
  fluidDensity: 2.0,
};

class Physics {
  public options: PhysicsOptionsType;
  public engine: Engine;

  public core: PhysicsCore;

  constructor(engine: Engine, options: Partial<PhysicsOptionsType>) {
    this.options = {
      ...defaultPhysicsOptions,
      ...options,
    };

    this.engine = engine;

    const testSolidity = (wx: number, wy: number, wz: number) => {
      return engine.world.getSolidityByWorld([wx, wy, wz]);
    };

    const testFluidity = (wx: number, wy: number, wz: number) => {
      return engine.world.getFluidityByVoxel([wx, wy, wz]);
    };

    this.core = new PhysicsCore(testSolidity, testFluidity, this.options);
  }

  tick() {
    const { world, clock } = this.engine;
    if (!world.isReady) return;

    const { delta } = clock;
    this.core.tick(delta);
  }

  getObjectPositionFromRB(rigidBody: RigidBody) {
    const [px, py, pz] = rigidBody.getPosition();
    const { vec } = rigidBody.aabb;
    return [px + vec[0] / 2, py + vec[1] / 2, pz + vec[2] / 2];
  }

  setPositionFromPhysics(rigidBody: RigidBody, object: Object3D) {
    const [px, py, pz] = this.getObjectPositionFromRB(rigidBody);
    object.position.set(px, py, pz);
  }

  lerpPositionFromPhysics(rigidBody: RigidBody, object: Object3D, lerpFactor: number) {
    const [px, py, pz] = this.getObjectPositionFromRB(rigidBody);
    object.position.lerp(new Vector3(px, py, pz), lerpFactor);
  }
}

export { Physics, PhysicsOptionsType };
