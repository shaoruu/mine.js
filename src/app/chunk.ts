import vec3 from 'gl-vec3';
import ndarray from 'ndarray';
import { BufferAttribute, BufferGeometry, Mesh } from 'three';

import { Engine } from '..';
import { Coords3 } from '../libs';
import { simpleCull } from '../libs/meshers';
import { Helper } from '../utils';

type ChunkOptions = {
  size: number;
  dimension: number;
  padding: number;
};

class Chunk {
  public coords: Coords3;
  public voxels: ndarray;
  public engine: Engine;

  public name: string;
  public size: number;
  public dimension: number;
  public padding: number;
  public width: number;

  // voxel position references in voxel space
  public minInner: Coords3; // chunk's minimum voxel (not padded)
  public minOuter: Coords3; // chunk's minimum voxel (padded)
  public maxInner: Coords3; // chunk's maximum voxel (not padded)
  public maxOuter: Coords3; // chunk's maximum voxel (padded)

  public geometry: BufferGeometry;
  public mesh: Mesh;

  public isEmpty = true;
  public isDirty = true;
  public isAdded = false;
  public isInitialized = false;
  public isPending = false; // pending for client-side terrain generation

  constructor(engine: Engine, coords: Coords3, { size, dimension, padding }: ChunkOptions) {
    this.engine = engine;
    this.coords = coords;

    this.size = size;
    this.dimension = dimension;
    this.padding = padding;
    this.width = size + padding * 2;
    this.name = Helper.getChunkName(this.coords);

    this.voxels = ndarray(new Int8Array(this.width * this.width * this.width), [this.width, this.width, this.width]);

    this.geometry = new BufferGeometry();

    this.minInner = [0, 0, 0];
    this.minOuter = [0, 0, 0];
    this.maxInner = [0, 0, 0];
    this.maxOuter = [0, 0, 0];

    // initialize
    vec3.copy(this.minInner, coords);
    vec3.copy(this.minOuter, coords);
    vec3.copy(this.maxInner, coords);
    vec3.copy(this.maxOuter, coords);

    // calculate
    const paddingVec = [padding, padding, padding];
    vec3.scale(this.minOuter, this.minOuter, size);
    vec3.sub(this.minOuter, this.minOuter, paddingVec);
    vec3.add(this.minInner, this.minOuter, paddingVec);
    vec3.copy(this.maxOuter, coords);
    vec3.add(this.maxOuter, this.maxOuter, [1, 1, 1]);
    vec3.scale(this.maxOuter, this.maxOuter, size);
    vec3.add(this.maxOuter, this.maxOuter, paddingVec);
    vec3.sub(this.maxInner, this.maxOuter, paddingVec);
  }

  // goes from [-padding, -padding, -padding] to [size + padding - 1, size + padding - 1, size + padding - 1]
  getLocal(lx: number, ly: number, lz: number) {
    return this.voxels.get(lx + this.padding, ly + this.padding, lz + this.padding);
  }

  // goes from [-padding, -padding, -padding] to [size + padding - 1, size + padding - 1, size + padding - 1]
  setLocal(lx: number, ly: number, lz: number, id: number) {
    return this.voxels.set(lx + this.padding, ly + this.padding, lz + this.padding, id);
  }

  getVoxel(vx: number, vy: number, vz: number) {
    const [lx, ly, lz] = vec3.sub([0, 0, 0], [vx, vy, vz], this.minInner);
    return this.getLocal(lx, ly, lz);
  }

  setVoxel(vx: number, vy: number, vz: number, id: number) {
    if (id !== 0) this.isEmpty = false;
    this.isDirty = true; // mark chunk as dirty
    const [lx, ly, lz] = vec3.sub([0, 0, 0], [vx, vy, vz], this.minInner);
    this.setLocal(lx, ly, lz, id);
  }

  initialized() {
    this.isInitialized = true;
    this.isPending = false;
  }

  async buildMesh() {
    // mark chunk as built mesh
    this.isDirty = false;

    if (this.isEmpty) return;

    const { positions, normals, indices, uvs, aos } = await simpleCull(this);

    const positionNumComponents = 3;
    const normalNumComponents = 3;
    const uvNumComponents = 2;
    const occlusionNumComponents = 1;

    this.geometry.setAttribute('position', new BufferAttribute(positions, positionNumComponents));
    this.geometry.setAttribute('normal', new BufferAttribute(normals, normalNumComponents));
    this.geometry.setAttribute('uv', new BufferAttribute(uvs, uvNumComponents));
    this.geometry.setAttribute('ao', new BufferAttribute(aos, occlusionNumComponents));
    this.geometry.setIndex(Array.from(indices));

    this.mesh = new Mesh(this.geometry, this.engine.registry.material);
    this.mesh.name = this.name;
    this.mesh.renderOrder = 10000;
    this.mesh.frustumCulled = false;
  }

  addToScene() {
    this.removeFromScene();
    if (this.mesh) {
      this.engine.rendering.scene.add(this.mesh);
      this.isAdded = true;
    }
  }

  removeFromScene() {
    if (this.isAdded && this.mesh) {
      this.engine.rendering.scene.remove(this.mesh);
      this.isAdded = false;
    }
  }
}

export { Chunk };
