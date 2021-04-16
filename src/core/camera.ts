import raycast from 'fast-voxel-raycast';
import { BoxBufferGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Vector3, BufferGeometry } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

import { Coords3, EntityType } from '../libs';
import { Helper } from '../utils';

import { Engine } from './engine';

type CameraOptionsType = {
  fov: number;
  near: number;
  far: number;
  initPos: [number, number, number];
  minPolarAngle: number;
  maxPolarAngle: number;
  acceleration: number;
  flyingInertia: number;
  reachDistance: number;
  lookBlockScale: number;
  lookBlockLerp: number;
  distToGround: number;
  distToTop: number;
  cameraWidth: number;
};

class Camera {
  public engine: Engine;
  public threeCamera: PerspectiveCamera;
  public controls: PointerLockControls;

  public options: CameraOptionsType;
  public lookBlock: Coords3 | null = [0, 0, 0];
  public targetBlock: Coords3 | null = [0, 0, 0];
  public camGeometry: BufferGeometry;
  public camMesh: Mesh;
  public camEntity: EntityType;

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

  constructor(engine: Engine, options: CameraOptionsType) {
    this.engine = engine;
    const { fov, near, far, initPos, lookBlockScale, distToGround, distToTop, cameraWidth } = (this.options = options);

    // three.js camera
    this.threeCamera = new PerspectiveCamera(fov, this.engine.rendering.aspectRatio, near, far);

    // three.js pointerlock controls
    this.controls = new PointerLockControls(this.threeCamera, this.engine.container.canvas);
    this.engine.rendering.scene.add(this.controls.getObject());
    this.engine.container.canvas.onclick = () => this.controls.lock();

    // initialize camera position
    this.controls.getObject().position.set(...initPos);
    this.threeCamera.lookAt(new Vector3(0, 0, 0));

    // listen to resize, and adjust accordingly
    // ? should move to it's own logic for all event listeners?
    window.addEventListener('resize', () => {
      engine.container.fitCanvas();
      engine.rendering.adjustRenderer();

      this.threeCamera.aspect = engine.rendering.aspectRatio;
      this.threeCamera.updateProjectionMatrix();
    });

    // movement handling
    document.addEventListener('keydown', this.onKeyDown, false);
    document.addEventListener('keyup', this.onKeyUp, false);

    // look block
    engine.on('ready', () => {
      const { dimension } = engine.world.options;

      const cameraWorldWidth = cameraWidth * dimension;
      const cameraWorldHeight = (distToGround + distToTop) * dimension;

      // set up camera's mesh
      this.camGeometry = new BoxBufferGeometry(cameraWorldWidth, cameraWorldHeight, cameraWorldWidth);
      this.camMesh = new Mesh(this.camGeometry);
      this.threeCamera.add(this.camMesh);
      this.camMesh.position.y -= distToGround * dimension;
      engine.rendering.scene.add(this.camMesh);

      // register camera as entity
      this.camEntity = engine.entities.addEntity(
        'camera',
        this.threeCamera,
        [cameraWorldWidth, cameraWorldHeight, cameraWorldWidth],
        [0, (distToGround - (distToGround + distToTop) / 2) * dimension, 0],
      );

      // set up look block mesh
      this.lookBlockMesh = new Mesh(
        new BoxBufferGeometry(dimension * lookBlockScale, dimension * lookBlockScale, dimension * lookBlockScale),
        new MeshBasicMaterial({
          color: 'white',
          alphaTest: 0.2,
          opacity: 0.3,
          transparent: true,
        }),
      );
      this.lookBlockMesh.renderOrder = 100000;

      engine.rendering.scene.add(this.lookBlockMesh);
    });

    engine.on('world-ready', () => {
      const maxHeight = engine.world.getMaxHeightByVoxel(this.options.initPos);
      const [ix, iy, iz] = this.options.initPos;
      if (iy < maxHeight) {
        this.teleport([ix, maxHeight, iz]);
      }
    });
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
    const { state } = this.camEntity.brain;

    const { right, left, up, down, front, back } = this.movements;

    const fb = front ? (back ? 0 : 1) : back ? -1 : 0;
    const rl = left ? (right ? 0 : 1) : right ? -1 : 0;

    // get the frontwards-backwards direction vectors
    this.vec.setFromMatrixColumn(this.threeCamera.matrix, 0);
    this.vec.crossVectors(this.threeCamera.up, this.vec);
    const { x: forwardX, z: forwardZ } = this.vec;

    // get the side-ways vectors
    this.vec.setFromMatrixColumn(this.threeCamera.matrix, 0);
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

    this.updateLookBlock();
  };

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

  get voxel(): Coords3 {
    return Helper.mapWorldPosToVoxelPos(this.position, this.engine.world.options.dimension);
  }

  get position(): Coords3 {
    const { x, y, z } = this.threeCamera.position;
    return [x, y, z];
  }

  get voxelPositionStr() {
    const { voxel } = this;
    return `${voxel[0]} ${voxel[1]} ${voxel[2]}`;
  }

  get lookBlockStr() {
    const { lookBlock } = this;
    return lookBlock ? `${lookBlock[0]} ${lookBlock[1]} ${lookBlock[2]}` : 'None';
  }

  private updateLookBlock() {
    const { world } = this.engine;
    const { dimension } = world.options;
    const { reachDistance, lookBlockLerp } = this.options;

    const camDir = new Vector3();
    const camPos = this.threeCamera.position;
    this.threeCamera.getWorldDirection(camDir);
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
    const newLookBlock = Helper.mapWorldPosToVoxelPos(flooredPoint as Coords3, world.options.dimension);

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

export { Camera, CameraOptionsType };
