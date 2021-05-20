import { PerspectiveCamera, Vector3 } from 'three';

import { Engine } from './engine';

type CameraOptionsType = {
  fov: number;
  near: number;
  far: number;
  minPolarAngle: number;
  maxPolarAngle: number;
};

class Camera {
  public engine: Engine;
  public threeCamera: PerspectiveCamera;

  public options: CameraOptionsType;

  constructor(engine: Engine, options: CameraOptionsType) {
    this.engine = engine;
    const { fov, near, far } = (this.options = options);

    // three.js camera
    this.threeCamera = new PerspectiveCamera(fov, this.engine.rendering.aspectRatio, near, far);

    // initialize camera position
    this.threeCamera.lookAt(new Vector3(0, 0, 0));

    // listen to resize, and adjust accordingly
    // ? should move to it's own logic for all event listeners?
    window.addEventListener('resize', () => {
      engine.container.fitCanvas();
      engine.rendering.adjustRenderer();

      this.threeCamera.aspect = engine.rendering.aspectRatio;
      this.threeCamera.updateProjectionMatrix();
    });
  }
}

export { Camera, CameraOptionsType };
