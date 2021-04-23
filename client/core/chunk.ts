import vec3 from 'gl-vec3';
import ndarray from 'ndarray';
import { BufferGeometry, Float32BufferAttribute, Int8BufferAttribute, Mesh } from 'three';
import pool from 'typedarray-pool';

import { Coords2, Coords3, MeshType } from '../../shared';
import { Helper } from '../utils';

import { Engine } from './engine';

type ChunkOptions = {
  size: number;
  maxHeight: number;
  dimension: number;
};

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

  public geometry: BufferGeometry;
  public mesh: Mesh;
  public altMesh: Mesh | undefined; // this way, this.mesh is in existence until ready to change, avoiding empty chunk frames

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

    this.geometry = new BufferGeometry();

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
    return Math.sqrt((mx + this.size / 2 - vx) * (mx + this.size / 2 - vx) + (mz + this.size / 2 - vz) * (mz - vz));
  }

  addToScene() {
    this.removeFromScene();
    if (!this.isAdded && this.altMesh) {
      this.engine.rendering.scene.add(this.altMesh);
      this.engine.world.addAsVisible(this);
      this.mesh = this.altMesh;
      this.isAdded = true;
    }
  }

  removeFromScene() {
    if (this.isAdded && this.mesh) {
      this.engine.rendering.scene.remove(this.mesh);
      this.engine.world.removeAsVisible(this);
      this.isAdded = false;
    }
  }

  dispose() {
    this.geometry.dispose();
    pool.free(this.voxels.data);
  }

  setupMesh(meshData: MeshType) {
    const { positions, normals, indices, uvs, aos, torchLights, sunlights } = meshData;

    this.isMeshing = true;

    const positionNumComponents = 3;
    const normalNumComponents = 3;
    const uvNumComponents = 2;
    const occlusionNumComponents = 1;
    const sunlightsNumComponents = 1;
    const torchLightsNumComponents = 1;

    this.geometry.dispose();
    this.geometry.setAttribute('position', new Float32BufferAttribute(positions, positionNumComponents));
    this.geometry.setAttribute('normal', new Int8BufferAttribute(normals, normalNumComponents));
    this.geometry.setAttribute('uv', new Float32BufferAttribute(uvs, uvNumComponents));
    this.geometry.setAttribute('ao', new Float32BufferAttribute(aos, occlusionNumComponents));
    this.geometry.setAttribute('sunlight', new Float32BufferAttribute(sunlights, sunlightsNumComponents));
    this.geometry.setAttribute('torchLight', new Float32BufferAttribute(torchLights, torchLightsNumComponents));
    this.geometry.setIndex(Array.from(indices));

    this.altMesh = new Mesh(this.geometry, this.engine.registry.material);
    this.altMesh.name = this.name;
    this.altMesh.frustumCulled = false;

    // mark chunk as built mesh
    this.isMeshing = false;
  }

  private toLocal = (vx: number, vy: number, vz: number) => {
    return vec3.sub([0, 0, 0], [vx, vy, vz], this.min) as Coords3;
  };
}

export { Chunk };
