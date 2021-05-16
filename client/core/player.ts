import raycast from 'fast-voxel-raycast';
import { BoxBufferGeometry, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

import { Coords3, Helper } from '../../shared';
import { EntityType } from '../libs';

import { Engine } from '.';

type PlayerOptionsType = {
  acceleration: number;
  flyingInertia: number;
  reachDistance: number;
  lookBlockScale: number;
  lookBlockLerp: number;
  lookBlockColor: string;
  distToGround: number;
  distToTop: number;
  bodyWidth: number;
};

const TEMP_BLOCK_MAP = [1, 2, 3, 4, 5, 6, 7, 10, 11, 13];
let type = 1;

class Player {
  public controls: PointerLockControls;

  public lookBlock: Coords3 | null = [0, 0, 0];
  public targetBlock: Coords3 | null = [0, 0, 0];
  public camEntity: EntityType;

  private acc = new Vector3();
  private vel = new Vector3();
  private vec = new Vector3();
  private movements = {
    up: false,
    down: false,
    left: false,
    right: false,
    front: false,
    back: false,
  };
  private lookBlockMesh: Mesh;
  private godMode = false;

  constructor(public engine: Engine, public options: PlayerOptionsType) {
    const { lookBlockScale, lookBlockColor } = options;

    // three.js pointerlock controls
    this.controls = new PointerLockControls(engine.camera.threeCamera, engine.container.canvas);
    engine.rendering.scene.add(this.controls.getObject());
    engine.container.canvas.onclick = () => this.controls.lock();

    // movement handling
    document.addEventListener('keydown', this.onKeyDown, false);
    document.addEventListener('keyup', this.onKeyUp, false);

    const { config, rendering, inputs, world } = engine;

    // look block
    engine.on('ready', () => {
      // register camera as entity      // set up look block mesh
      const { dimension } = config.world;
      this.addCamEntity();

      this.lookBlockMesh = new Mesh(
        new BoxBufferGeometry(dimension * lookBlockScale, dimension * lookBlockScale, dimension * lookBlockScale),
        new MeshBasicMaterial({
          color: lookBlockColor,
          alphaTest: 0.2,
          opacity: 0.2,
          transparent: true,
        }),
      );
      this.lookBlockMesh.renderOrder = 100000;

      rendering.scene.add(this.lookBlockMesh);
    });

    inputs.bind('f', () => this.toggleGodMode());
    inputs.click('left', () => world.breakVoxel());
    inputs.click('right', () => world.placeVoxel(type));

    for (let i = 0; i < TEMP_BLOCK_MAP.length; i++) {
      inputs.bind(i.toString(), () => (type = TEMP_BLOCK_MAP[i]));
    }

    this.controls.addEventListener('lock', () => engine.emit('lock'));
    this.controls.addEventListener('unlock', () => engine.emit('unlock'));
  }

  onKeyDown = ({ code }: KeyboardEvent) => {
    if (!this.controls.isLocked) return;

    switch (code) {
      case 'ArrowUp':
      case 'KeyW':
        this.movements.front = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        this.movements.left = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.movements.back = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.movements.right = true;
        break;

      case 'Space':
        this.movements.up = true;
        break;

      case 'ShiftLeft':
        this.movements.down = true;
        break;
    }
  };

  onKeyUp = ({ code }: KeyboardEvent) => {
    switch (code) {
      case 'ArrowUp':
      case 'KeyW':
        this.movements.front = false;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        this.movements.left = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.movements.back = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.movements.right = false;
        break;

      case 'Space':
        this.movements.up = false;
        break;

      case 'ShiftLeft':
        this.movements.down = false;
        break;
    }
  };

  tick = () => {
    if (this.godMode) {
      this.godModeMovements();
    } else {
      this.moveCamEntity();
    }
    this.updateLookBlock();
  };

  godModeMovements() {
    const { delta } = this.engine.clock;

    const { right, left, up, down, front, back } = this.movements;
    const { acceleration, flyingInertia } = this.options;

    const movementVec = new Vector3();
    movementVec.x = Number(right) - Number(left);
    movementVec.z = Number(front) - Number(back);
    movementVec.normalize();

    const yMovement = Number(up) - Number(down);

    this.acc.x = -movementVec.x * acceleration;
    this.acc.y = yMovement * acceleration;
    this.acc.z = -movementVec.z * acceleration;

    this.vel.x -= this.vel.x * flyingInertia * delta;
    this.vel.y -= this.vel.y * flyingInertia * delta;
    this.vel.z -= this.vel.z * flyingInertia * delta;

    this.vel.add(this.acc.multiplyScalar(delta));
    this.acc.set(0, 0, 0);

    this.controls.moveRight(-this.vel.x);
    this.controls.moveForward(-this.vel.z);

    this.controls.getObject().position.y += this.vel.y;
  }

  moveCamEntity() {
    const { threeCamera } = this.engine.camera;
    const { state } = this.camEntity.brain;

    const { right, left, up, down, front, back } = this.movements;

    const fb = front ? (back ? 0 : 1) : back ? -1 : 0;
    const rl = left ? (right ? 0 : 1) : right ? -1 : 0;

    // get the frontwards-backwards direction vectors
    this.vec.setFromMatrixColumn(threeCamera.matrix, 0);
    this.vec.crossVectors(threeCamera.up, this.vec);
    const { x: forwardX, z: forwardZ } = this.vec;

    // get the side-ways vectors
    this.vec.setFromMatrixColumn(threeCamera.matrix, 0);
    const { x: sideX, z: sideZ } = this.vec;

    const totalX = forwardX + sideX;
    const totalZ = forwardZ + sideZ;

    let angle = Math.atan2(totalX, totalZ);

    if ((fb | rl) === 0) {
      state.running = false;
    } else {
      state.running = true;
      if (fb) {
        if (fb === -1) angle += Math.PI;
        if (rl) {
          angle += (Math.PI / 4) * fb * rl;
        }
      } else {
        angle += (rl * Math.PI) / 2;
      }
      // not sure why add Math.PI / 4, but it was always off by that.
      state.heading = angle + Math.PI / 4;
    }

    // set jump as true, and brain will handle the jumping
    state.jumping = up ? (down ? false : true) : down ? false : false;
  }

  teleport(voxel: Coords3) {
    const {
      config: {
        world: { dimension },
      },
    } = this.engine;
    const [vx, vy, vz] = voxel;
    const newPosition = [vx * dimension, (vy + 2) * dimension, vz * dimension];

    this.camEntity.body.setPosition(newPosition);
    return newPosition;
  }

  toggleGodMode() {
    this.godMode = !this.godMode;
    if (this.godMode) {
      this.vel.set(0, 0, 0);
      this.acc.set(0, 0, 0);
      this.engine.entities.removeEntity('camera');
    } else {
      // activated again
      this.addCamEntity();
    }
  }

  addCamEntity() {
    const { bodyWidth, distToGround, distToTop } = this.options;
    const { dimension } = this.engine.world.options;
    const cameraWorldWidth = bodyWidth * dimension;
    const cameraWorldHeight = (distToGround + distToTop) * dimension;

    this.camEntity = this.engine.entities.addEntity(
      'camera',
      this.engine.camera.threeCamera,
      [cameraWorldWidth, cameraWorldHeight, cameraWorldWidth],
      [0, (distToGround - (distToGround + distToTop) / 2) * dimension, 0],
    );

    this.camEntity.body.applyImpulse([0, 4, 0]);
  }

  get lookBlockStr() {
    const { lookBlock } = this;
    return lookBlock ? `${lookBlock[0]} ${lookBlock[1]} ${lookBlock[2]}` : 'None';
  }

  private updateLookBlock() {
    const { world, camera } = this.engine;
    const { dimension } = world.options;
    const { reachDistance, lookBlockLerp } = this.options;

    const camDir = new Vector3();
    const camPos = camera.threeCamera.position;
    camera.threeCamera.getWorldDirection(camDir);
    camDir.normalize();

    const point: number[] = [];
    const normal: number[] = [];

    const result = raycast(
      (x, y, z) => Boolean(world.getVoxelByWorld([Math.floor(x), Math.floor(y), Math.floor(z)])),
      [camPos.x, camPos.y, camPos.z],
      [camDir.x, camDir.y, camDir.z],
      reachDistance * dimension,
      point,
      normal,
    );

    if (!result) {
      // no target
      this.lookBlockMesh.visible = false;
      this.lookBlock = null;
      this.targetBlock = null;
      return;
    }

    this.lookBlockMesh.visible = true;
    const flooredPoint = point.map((n, i) => Math.floor(parseFloat(n.toFixed(3))) - Number(normal[i] > 0));

    const [nx, ny, nz] = normal;
    const newLookBlock = Helper.mapWorldPosToVoxelPos(<Coords3>flooredPoint, world.options.dimension);

    if (!world.getVoxelByVoxel(newLookBlock)) {
      // this means the look block isn't actually a block
      return;
    }

    const [lbx, lby, lbz] = newLookBlock;
    this.lookBlockMesh.position.lerp(
      new Vector3(
        lbx * dimension + 0.5 * dimension,
        lby * dimension + 0.5 * dimension,
        lbz * dimension + 0.5 * dimension,
      ),
      lookBlockLerp,
    );

    this.lookBlock = newLookBlock;
    // target block is look block summed with the normal
    this.targetBlock = [this.lookBlock[0] + nx, this.lookBlock[1] + ny, this.lookBlock[2] + nz];
  }
}

export { Player, PlayerOptionsType };
