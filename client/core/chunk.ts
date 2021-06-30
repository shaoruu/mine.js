import TWEEN from '@tweenjs/tween.js';
import vec3 from 'gl-vec3';
import ndarray from 'ndarray';
import { BufferGeometry, Float32BufferAttribute, Mesh, Group, Int32BufferAttribute } from 'three';
import pool from 'typedarray-pool';

import { ServerMeshType } from '../libs';
import { Coords3, Coords2 } from '../libs/types';
import { Helper } from '../utils';

import { Engine } from '.';

type ChunkOptions = {
  size: number;
  maxHeight: number;
  dimension: number;
};
const MESH_TYPES = ['transparent', 'opaque'];

const DATA_PADDING = 1;

class Chunk {
  public voxels: ndarray;
  public lights: ndarray;

  public name: string;
  public size: number;
  public maxHeight: number;
  public dimension: number;
  public width: number;

  // voxel position references in voxel space
  public min: Coords3 = [0, 0, 0];
  public max: Coords3 = [0, 0, 0];

  public geometries: Map<string, BufferGeometry[]> = new Map();
  public meshes: Map<string, Mesh[]> = new Map();
  public altMeshes: Map<string, Mesh[]> = new Map();
  public mesh: Group;

  public isEmpty = true;
  public isDirty = true;
  public isAdded = false;
  public isMeshing = false; // is meshing
  public isInitialized = false; // is populated with terrain info
  public isPending = false; // pending for client-side terrain generation

  constructor(public engine: Engine, public coords: Coords2, { size, dimension, maxHeight }: ChunkOptions) {
    this.size = size;
    this.maxHeight = maxHeight;
    this.dimension = dimension;
    this.name = Helper.getChunkName(this.coords);

    this.voxels = ndarray(pool.mallocUint8((size + DATA_PADDING * 2) * maxHeight * (size + DATA_PADDING * 2)), [
      size + DATA_PADDING * 2,
      maxHeight,
      size + DATA_PADDING * 2,
    ]);
    this.lights = ndarray(pool.mallocUint8((size + DATA_PADDING * 2) * maxHeight * (size + DATA_PADDING * 2)), [
      size + DATA_PADDING * 2,
      maxHeight,
      size + DATA_PADDING * 2,
    ]);

    this.mesh = new Group();

    const [cx, cz] = coords;
    const coords3 = [cx, 0, cz];

    // initialize
    vec3.copy(this.min, coords3);
    vec3.copy(this.max, coords3);
    vec3.scale(this.min, this.min, size);
    vec3.add(this.max, this.max, [1, 0, 1]);
    vec3.scale(this.max, this.max, size);
    vec3.add(this.max, this.max, [0, maxHeight, 0]);
  }

  setVoxel = (vx: number, vy: number, vz: number, type: number) => {
    if (!this.contains(vx, vy, vz)) return;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.voxels.set(lx, ly, lz, type);
  };

  getVoxel = (vx: number, vy: number, vz: number) => {
    if (!this.contains(vx, vy, vz)) return 1;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.voxels.get(lx, ly, lz);
  };

  getLocalTorchLight(lx: number, ly: number, lz: number) {
    return this.lights.get(lx, ly, lz) & 0xf;
  }

  getLocalSunlight(lx: number, ly: number, lz: number) {
    return (this.lights.get(lx, ly, lz) >> 4) & 0xf;
  }

  getTorchLight(vx: number, vy: number, vz: number) {
    const lCoords = this.toLocal(vx, vy, vz);
    return this.getLocalTorchLight(...lCoords);
  }

  getSunlight(vx: number, vy: number, vz: number) {
    const lCoords = this.toLocal(vx, vy, vz);
    return this.getLocalSunlight(...lCoords);
  }

  contains = (vx: number, vy: number, vz: number, padding = DATA_PADDING) => {
    const { size, maxHeight } = this;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);

    return lx >= -padding && lx < size + padding && ly >= 0 && ly < maxHeight && lz >= -padding && lz < size + padding;
  };

  distTo = (vx: number, _: number, vz: number) => {
    const [mx, , mz] = this.min;
    return Math.sqrt((mx + this.size / 2 - vx) ** 2 + (mz + this.size / 2 - vz) ** 2);
  };

  animate = (inverse = false) => {
    // chunk floating upwards animation
    const { chunkAnimation, animationTime } = this.engine.world.options;
    if (!chunkAnimation) return;
    this.mesh.position.y = inverse ? 0 : -10;
    return new TWEEN.Tween(this.mesh.position).to({ y: inverse ? -10 : 0 }, animationTime).start();
  };

  addToScene = () => {
    const { rendering } = this.engine;

    rendering.scene.add(this.mesh);

    if (!this.isAdded) {
      MESH_TYPES.forEach((type) => {
        const altMesh = this.altMeshes.get(type);
        if (altMesh && altMesh.length) {
          this.mesh.add(...altMesh);
          this.meshes.set(type, altMesh);
        }
      });
      this.isAdded = true;

      this.animate();
    }
  };

  removeFromScene = () => {
    const { rendering } = this.engine;

    this.animate(true).onComplete(() => {
      rendering.scene.remove(this.mesh);

      if (this.isAdded) {
        MESH_TYPES.forEach((type) => {
          const mesh = this.meshes.get(type);
          if (mesh && mesh.length) this.mesh.remove(...mesh);
        });
        this.isAdded = false;
      }
    });
  };

  dispose = () => {
    this.geometries.forEach((geo) => geo.forEach((g) => g.dispose()));
    pool.free(this.voxels.data);
  };

  setupMesh = (meshDataList: ServerMeshType[]) => {
    this.isMeshing = true;

    meshDataList.forEach((meshData) => {
      const i = meshData.subChunk || 0;

      MESH_TYPES.forEach((type) => {
        if (!meshData[type]) {
          this.altMeshes.set(type, undefined);
          return;
        }

        if (!this.altMeshes.has(type)) {
          this.altMeshes.set(type, []);
        }

        const { positions, indices, uvs, aos, torchLights, sunlights } = meshData[type];

        const positionNumComponents = 3;
        const uvNumComponents = 2;
        const occlusionNumComponents = 1;
        const sunlightsNumComponents = 1;
        const torchLightsNumComponents = 1;

        let geometries = this.geometries.get(type);
        if (!geometries) {
          this.geometries.set(type, []);
          geometries = this.geometries.get(type);
        }

        const geometry = geometries[i] || new BufferGeometry();

        geometry.dispose();
        geometry.setAttribute('position', new Float32BufferAttribute(positions, positionNumComponents));
        geometry.setAttribute('uv', new Float32BufferAttribute(uvs, uvNumComponents));
        geometry.setAttribute('ao', new Int32BufferAttribute(aos, occlusionNumComponents));
        geometry.setAttribute('sunlight', new Int32BufferAttribute(sunlights, sunlightsNumComponents));
        geometry.setAttribute('torchLight', new Int32BufferAttribute(torchLights, torchLightsNumComponents));
        geometry.setIndex(Array.from(indices));

        const materials =
          type === 'opaque'
            ? [this.engine.registry.opaqueChunkMaterial]
            : this.engine.registry.transparentChunkMaterials;

        materials.forEach((material) => {
          const altMesh = new Mesh(geometry, material);
          altMesh.name = this.name;
          altMesh.frustumCulled = false;
          altMesh.renderOrder = type === 'opaque' ? 1000 : 100;

          this.altMeshes.get(type).push(altMesh);
        });

        geometries[i] = geometry;
      });
    });

    // mark chunk as built mesh
    this.isMeshing = false;
  };

  private toLocal = (vx: number, vy: number, vz: number) => {
    return <Coords3>vec3.add([0, 0, 0], vec3.sub([0, 0, 0], [vx, vy, vz], this.min), [DATA_PADDING, 0, DATA_PADDING]);
  };
}

export { Chunk };
