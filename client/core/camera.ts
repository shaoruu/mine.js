import { Frustum, Matrix4, PerspectiveCamera, Vector3 } from 'three';

import { Engine } from './engine';

type CameraOptionsType = {
  fov: number;
  near: number;
  far: number;
  minPolarAngle: number;
  maxPolarAngle: number;
};

class Camera {
  public threeCamera: PerspectiveCamera;
  public frustum: Frustum;

  constructor(public engine: Engine, public options: CameraOptionsType) {
    const { fov, near, far } = this.options;

    // three.js camera
    this.threeCamera = new PerspectiveCamera(fov, this.engine.rendering.aspectRatio, near, far);

    // initialize camera position
    this.threeCamera.lookAt(new Vector3(0, 0, 0));

    // initialize the three.js frustum
    this.frustum = new Frustum();

    // listen to resize, and adjust accordingly
    // ? should move to it's own logic for all event listeners?
    window.addEventListener('resize', () => {
      engine.container.fitCanvas();
      engine.rendering.adjustRenderer();

      this.threeCamera.aspect = engine.rendering.aspectRatio;
      this.threeCamera.updateProjectionMatrix();
    });
  }

  tick = () => {
    const projectionMatrix = new Matrix4().multiplyMatrices(
      this.threeCamera.projectionMatrix,
      this.threeCamera.matrixWorldInverse,
    );
    this.frustum.setFromProjectionMatrix(projectionMatrix);
    this.engine.world.chunkMeshes.forEach((mesh) => {
      mesh.visible = this.frustum.intersectsBox(mesh.geometry.boundingBox);
    });
  };
}

export { Camera, CameraOptionsType };
