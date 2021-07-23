import { Frustum, Matrix4, PerspectiveCamera, Vector3, Mesh, MathUtils } from 'three';

import { Engine } from './engine';

type CameraOptionsType = {
  fov: number;
  near: number;
  far: number;
  lerpFactor: number;
  minPolarAngle: number;
  maxPolarAngle: number;
};

class Camera {
  public threeCamera: PerspectiveCamera;
  public frustum: Frustum;
  public visibles: Mesh[] = [];

  private newZoom: number;
  private newFOV: number;

  constructor(public engine: Engine, public options: CameraOptionsType) {
    const { fov, near, far } = this.options;

    this.newFOV = fov;
    this.newZoom = 1;

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
    this.visibles = [];
    const projectionMatrix = new Matrix4().multiplyMatrices(
      this.threeCamera.projectionMatrix,
      this.threeCamera.matrixWorldInverse,
    );
    this.frustum.setFromProjectionMatrix(projectionMatrix);
    this.engine.world.chunkMeshes.forEach((mesh) => {
      mesh.visible = this.frustum.intersectsBox(mesh.geometry.boundingBox);
      this.visibles.push(mesh);
    });

    if (this.newFOV !== this.threeCamera.fov) {
      this.threeCamera.fov = MathUtils.lerp(this.threeCamera.fov, this.newFOV, this.options.lerpFactor);
      this.threeCamera.updateProjectionMatrix();
    }

    if (this.newZoom !== this.threeCamera.zoom) {
      this.threeCamera.zoom = MathUtils.lerp(this.threeCamera.zoom, this.newZoom, this.options.lerpFactor);
      this.threeCamera.updateProjectionMatrix();
    }
  };

  setZoom = (zoom: number) => {
    this.newZoom = zoom;
  };

  setFOV = (fov: number) => {
    this.newFOV = fov;
  };
}

export { Camera, CameraOptionsType };
