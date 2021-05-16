import { Physics as PhysicsCore, RigidBody } from '../libs';

import { Engine } from './engine';

type PhysicsOptionsType = {
  gravity: [number, number, number];
  minBounceImpulse: number;
  airDrag: number;
  fluidDrag: number;
  fluidDensity: number;
};

class Physics {
  public core: PhysicsCore;

  constructor(public engine: Engine, public options: PhysicsOptionsType) {
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

  getPositionFromRB(rigidBody: RigidBody) {
    const [px, py, pz] = rigidBody.getPosition();
    const { vec } = rigidBody.aabb;
    return [px + vec[0] / 2, py + vec[1] / 2, pz + vec[2] / 2];
  }
}

export { Physics, PhysicsOptionsType };
