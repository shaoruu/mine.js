import vec3 from 'gl-vec3';
import ndarray from 'ndarray';
import { BufferGeometry, Float32BufferAttribute, Int8BufferAttribute, Mesh } from 'three';
import pool from 'typedarray-pool';

import { Coords2, Coords3 } from '../../shared';
import { ServerMeshType } from '../libs';
import { Helper } from '../utils';

import { Engine } from '.';

type ChunkOptions = {
  size: number;
  maxHeight: number;
  dimension: number;
};
const MESH_TYPES = ['opaque', 'transparent'];

class Chunk {
  public voxels: ndarray;

  public name: string;
  public size: number;
  public maxHeight: number;
  public dimension: number;
  public width: number;

  // voxel position references in voxel space
  public min: Coords3 = [0, 0, 0];
  public max: Coords3 = [0, 0, 0];

  public geometries: Map<string, BufferGeometry> = new Map();
  public meshes: Map<string, Mesh[]> = new Map();
  public altMeshes: Map<string, Mesh[]> = new Map();

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

    this.voxels = ndarray(pool.mallocUint8(size * maxHeight * size), [size, maxHeight, size]);

    MESH_TYPES.forEach((type) => {
      this.geometries.set(type, new BufferGeometry());
    });

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

  setVoxel(vx: number, vy: number, vz: number, type: number) {
    if (!this.contains(vx, vy, vz)) return;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.voxels.set(lx, ly, lz, type);
  }

  getVoxel(vx: number, vy: number, vz: number) {
    if (!this.contains(vx, vy, vz)) return;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.voxels.get(lx, ly, lz);
  }

  contains(vx: number, vy: number, vz: number, padding = 0) {
    const { size, maxHeight } = this;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);

    return lx >= -padding && lx < size + padding && ly >= 0 && ly < maxHeight && lz >= -padding && lz < size + padding;
  }

  distTo(vx: number, _: number, vz: number) {
    const [mx, , mz] = this.min;
    return Math.sqrt((mx + this.size / 2 - vx) ** 2 + (mz + this.size / 2 - vz) ** 2);
  }

  addToScene() {
    const { rendering, world } = this.engine;
    this.removeFromScene();
    if (!this.isAdded) {
      MESH_TYPES.forEach((type) => {
        const altMesh = this.altMeshes.get(type);
        if (altMesh && altMesh.length) {
          rendering.scene.add(...altMesh);
          this.meshes.set(type, altMesh);
        }
      });
      world.addAsVisible(this);
      this.isAdded = true;
    }
  }

  removeFromScene() {
    const { rendering, world } = this.engine;
    if (this.isAdded) {
      MESH_TYPES.forEach((type) => {
        const mesh = this.meshes.get(type);
        if (mesh && mesh.length) rendering.scene.remove(...mesh);
      });
      world.removeAsVisible(this);
      this.isAdded = false;
    }
  }

  dispose() {
    this.geometries.forEach((geo) => geo.dispose());
    pool.free(this.voxels.data);
  }

  setupMesh(meshDataList: ServerMeshType[]) {
    this.isMeshing = true;

    meshDataList.forEach((meshData) => {
      MESH_TYPES.forEach((type) => {
        if (!meshData[type]) {
          this.altMeshes.set(type, undefined);
          return;
        }

        this.altMeshes.set(type, []);

        const { positions, normals, indices, uvs, aos, torchLights, sunlights } = meshData[type];

        const positionNumComponents = 3;
        const normalNumComponents = 3;
        const uvNumComponents = 2;
        const occlusionNumComponents = 1;
        const sunlightsNumComponents = 1;
        const torchLightsNumComponents = 1;

        const geometry = this.geometries.get(type);

        // geometry.dispose();
        geometry.setAttribute('position', new Float32BufferAttribute(positions, positionNumComponents));
        geometry.setAttribute('normal', new Int8BufferAttribute(normals, normalNumComponents));
        geometry.setAttribute('uv', new Float32BufferAttribute(uvs, uvNumComponents));
        geometry.setAttribute('ao', new Float32BufferAttribute(aos, occlusionNumComponents));
        geometry.setAttribute('sunlight', new Float32BufferAttribute(sunlights, sunlightsNumComponents));
        geometry.setAttribute('torchLight', new Float32BufferAttribute(torchLights, torchLightsNumComponents));
        geometry.setIndex(Array.from(indices));

        const materials =
          type === 'opaque'
            ? [this.engine.registry.opaqueChunkMaterial]
            : this.engine.registry.transparentChunkMaterials;

        materials.forEach((material) => {
          const altMesh = new Mesh(geometry, material);
          altMesh.name = this.name;
          altMesh.frustumCulled = false;

          this.altMeshes.get(type).push(altMesh);
        });
      });
    });

    // mark chunk as built mesh
    this.isMeshing = false;
  }

  private toLocal = (vx: number, vy: number, vz: number) => {
    return <Coords3>vec3.sub([0, 0, 0], [vx, vy, vz], this.min);
  };
}

export { Chunk };
