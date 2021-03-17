import { Object3D } from 'three';

import { Engine } from '..';
import { Physics as PhysicsCore, RigidBody } from '../libs';

class Physics {
  public engine: Engine;

  public core: PhysicsCore;

  constructor(engine: Engine) {
    this.engine = engine;

    const testSolidity = (wx: number, wy: number, wz: number) => {
      return engine.world.getSolidityByWorld([wx, wy, wz]);
    };

    const testFluidity = (wx: number, wy: number, wz: number) => {
      return engine.world.getFluidityByVoxel([wx, wy, wz]);
    };

    this.core = new PhysicsCore(testSolidity, testFluidity);
  }

  tick() {
    const { world, clock } = this.engine;
    if (!world.isReady) return;

    const { delta } = clock;
    this.core.tick(delta);
  }

  setPositionFromPhysics(rigidBody: RigidBody, object: Object3D) {
    const [px, py, pz] = rigidBody.getPosition();
    const { vec } = rigidBody.aabb;
    object.position.set(px + vec[0] / 2, py + vec[1] / 2, pz + vec[2] / 2);
  }
}

export { Physics };
