import raycast from 'fast-voxel-raycast';
import { Object3D, Mesh, MeshBasicMaterial, CircleBufferGeometry, DoubleSide } from 'three';

import { Engine } from '.';

type ShadowsOptionsType = {
  maxRadius: number;
  maxDist: number;
};

type Shadow = {
  object: Object3D;
  mesh: Mesh;
};

class Shadows {
  public list: Shadow[];
  public material: MeshBasicMaterial;
  public geometry: CircleBufferGeometry;

  private maxDist: number;

  constructor(public engine: Engine, public options: ShadowsOptionsType) {
    this.list = [];

    this.material = new MeshBasicMaterial({
      side: DoubleSide,
      color: 'rgb(0,0,0)',
      opacity: 0.3,
      transparent: true,
    });

    this.geometry = new CircleBufferGeometry(options.maxRadius, 30);
  }

  tick = () => {
    const { maxDist } = this.options;

    this.list.forEach(({ mesh, object }) => {
      const { position } = object;

      const point: number[] = [];
      const normal: number[] = [];

      raycast(
        (x, y, z) => this.engine.world.getSolidityByWorld([x, y, z]),
        [position.x, position.y, position.z],
        [0, -1, 0],
        maxDist,
        point,
        normal,
      );

      const dist = Math.sqrt(
        (point[0] - position.x) ** 2 + (point[1] - position.y) ** 2 + (point[2] - position.z) ** 2,
      );
      const scale = Math.max(1 - dist / maxDist, 0) ** 2;

      mesh.position.set(point[0], point[1] + 0.01, point[2]);
      mesh.scale.set(scale, scale, 1);
    });
  };

  add = (object: Object3D) => {
    const mesh = new Mesh(this.geometry, this.material);
    mesh.rotateX(Math.PI / 2);

    this.engine.rendering.scene.add(mesh);

    this.list.push({
      object,
      mesh,
    });

    return mesh;
  };

  remove = (object: Object3D) => {
    const index = this.list.findIndex((e) => e.object === object);

    if (index > 0) {
      this.list.splice(index, 1);
    }
  };
}

export { Shadows, ShadowsOptionsType };
