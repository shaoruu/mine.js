import { BoxBufferGeometry, Mesh, Object3D } from 'three';

import { Engine } from '..';
import { AABB, Physics as PhysicsCore, RigidBody } from '../libs';

class Physics {
  public engine: Engine;

  public core: PhysicsCore;

  private testMesh: Mesh;
  private testRB: RigidBody;

  constructor(engine: Engine) {
    this.engine = engine;

    const testSolidity = (wx: number, wy: number, wz: number) => {
      return engine.world.getSolidityByWorld([wx, wy, wz]);
    };

    const testFluidity = (wx: number, wy: number, wz: number) => {
      return engine.world.getFluidityByVoxel([wx, wy, wz]);
    };

    this.core = new PhysicsCore(testSolidity, testFluidity);

    this.test();
  }

  test() {
    // context
    const position = [0, 40, 0];
    const size = [1, 1, 1];

    // create body
    const aabb = new AABB(position, size);
    const rigidBody = this.core.addBody(aabb, 0.2);

    // create render
    this.testMesh = new Mesh(new BoxBufferGeometry(...size));
    this.testMesh.position.set(position[0], position[1], position[2]);
    this.testRB = rigidBody;
    this.engine.rendering.scene.add(this.testMesh);

    document.addEventListener('keydown', ({ key }) => {
      if (key === 'x') {
        this.testRB.applyForce([0, 100, 0]);
      }
      if (key === 'c') {
        this.testRB.applyForce([Math.random() * 100 - 50, Math.random() * 100, Math.random() * 100 - 50]);
      }
    });
  }

  tick() {
    const { world, clock } = this.engine;
    if (!world.isReady) return;

    const { delta } = clock;
    this.core.tick(delta);

    // update render
    this.setPositionFromPhysics(this.testRB, this.testMesh);
  }

  setPositionFromPhysics(rigidBody: RigidBody, object: Object3D) {
    const [px, py, pz] = rigidBody.getPosition();
    const { vec } = rigidBody.aabb;
    object.position.set(px + vec[0] / 2, py + vec[1] / 2, pz + vec[2] / 2);
  }
}

export { Physics };
