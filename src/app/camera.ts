import { Engine } from '..';

import { PerspectiveCamera } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

type CameraOptions = {
  fov: number;
  near: number;
  far: number;
  minPolarAngle: number;
  maxPolarAngle: number;
};

const defaultCameraOptions: CameraOptions = {
  fov: 75,
  near: 0.1,
  far: 1000,
  minPolarAngle: 0,
  maxPolarAngle: Math.PI,
};

class Camera {
  public engine: Engine;
  public threeCamera: PerspectiveCamera;
  public controls: PointerLockControls;

  constructor(engine: Engine, options: Partial<CameraOptions> = {}) {
    const { fov, near, far } = {
      ...options,
      ...defaultCameraOptions,
    };

    this.engine = engine;

    // three.js camera
    this.threeCamera = new PerspectiveCamera(fov, this.engine.rendering.aspectRatio, near, far);

    // three.js pointerlock controls
    this.controls = new PointerLockControls(this.threeCamera, this.engine.container.canvas);
    this.engine.rendering.scene.add(this.controls.getObject());
    this.engine.container.canvas.onclick = () => this.controls.lock();

    window.addEventListener('resize', () => {
      this.threeCamera.aspect = engine.rendering.aspectRatio;
      this.threeCamera.updateProjectionMatrix();

      engine.rendering.adjustRenderer();
    });
  }

  tick = () => {};
}

export { Camera };
