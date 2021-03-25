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
  public engine: Engine;
  public coords: Coords3;
  public voxels: ndarray;
  public lights: ndarray;

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
  public altMesh: Mesh | undefined; // this way, this.mesh is in existence until ready to change, avoiding empty chunk frames

  public isEmpty = true;
  public isDirty = true;
  public isAdded = false;
  public isMeshing = false; // is meshing
  public isInitialized = false; // is populated with terrain info
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
    this.lights = ndarray(new Int8Array(this.width * this.width * this.width), [this.width, this.width, this.width]);

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

  // goes from [-padding, -padding, -padding] to [size + padding - 1, size + padding - 1, size + padding - 1]
  getLocalTorchLight(lx: number, ly: number, lz: number) {
    return this.lights.get(lx + this.padding, ly + this.padding, lz + this.padding) & 0xf;
  }

  // goes from [-padding, -padding, -padding] to [size + padding - 1, size + padding - 1, size + padding - 1]
  setLocalTorchLight(lx: number, ly: number, lz: number, level: number) {
    return this.lights.set(
      lx + this.padding,
      ly + this.padding,
      lz + this.padding,
      (this.getLocalTorchLight(lx, ly, lz) & 0xf0) | level,
    );
  }

  // goes from [-padding, -padding, -padding] to [size + padding - 1, size + padding - 1, size + padding - 1]
  getLocalSunlight(lx: number, ly: number, lz: number) {
    return (this.lights.get(lx + this.padding, ly + this.padding, lz + this.padding) >> 4) & 0xf;
  }

  // goes from [-padding, -padding, -padding] to [size + padding - 1, size + padding - 1, size + padding - 1]
  setLocalSunlight(lx: number, ly: number, lz: number, level: number) {
    return this.lights.set(
      lx + this.padding,
      ly + this.padding,
      lz + this.padding,
      (this.getLocalSunlight(lx, ly, lz) & 0xf0) | (level << 4),
    );
  }

  getVoxel(vx: number, vy: number, vz: number) {
    if (!this.contains(vx, vy, vz)) return;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.getLocal(lx, ly, lz);
  }

  setVoxel(vx: number, vy: number, vz: number, id: number) {
    if (!this.contains(vx, vy, vz)) return;
    // if voxel type doesn't change (might conflict with lighting)
    if (this.getVoxel(vx, vy, vz) === id) return;

    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    this.setLocal(lx, ly, lz, id);

    // change chunk state
    if (id !== 0) this.isEmpty = false;
    // mark chunk as dirty
    this.isDirty = true;
  }

  getTorchLight(vx: number, vy: number, vz: number) {
    // if (!this.contains(vx, vy, vz)) return 0; // ?
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.getLocalTorchLight(lx, ly, lz);
  }

  setTorchLight(vx: number, vy: number, vz: number, level: number) {
    if (!this.contains(vx, vy, vz)) return;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    this.setLocalTorchLight(lx, ly, lz, level);
    this.isDirty = true; // mesh rebuilt needed if light changes
  }

  contains(vx: number, vy: number, vz: number, padding = this.padding) {
    const { size } = this;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);

    return (
      lx >= -padding &&
      lx < size + padding &&
      ly >= -padding &&
      ly < size + padding &&
      lz >= -padding &&
      lz < size + padding
    );
  }

  distTo(vx: number, vy: number, vz: number) {
    const [mx, my, mz] = this.minInner;
    return Math.sqrt((mx - vx) * (mx - vx) + (my - vy) * (my - vy) + (mz - vz) * (mz - vz));
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

  async initialized() {
    this.isInitialized = true;
    this.isPending = false;

    // build mesh once initialized
    await this.buildMesh();
  }

  async buildMesh() {
    if (this.isEmpty) {
      // if it's empty, it can't be dirty
      this.isDirty = false;
      return;
    }

    // don't need to be meshed again
    this.isDirty = false;
    this.isMeshing = true;

    const { positions, normals, indices, uvs, aos, lights } = await simpleCull(this);

    const positionNumComponents = 3;
    const normalNumComponents = 3;
    const uvNumComponents = 2;
    const occlusionNumComponents = 1;
    const lightsNumComponents = 1;

    this.geometry.dispose();
    this.geometry.setAttribute('position', new BufferAttribute(positions, positionNumComponents));
    this.geometry.setAttribute('normal', new BufferAttribute(normals, normalNumComponents));
    this.geometry.setAttribute('uv', new BufferAttribute(uvs, uvNumComponents));
    this.geometry.setAttribute('ao', new BufferAttribute(aos, occlusionNumComponents));
    this.geometry.setAttribute('light', new BufferAttribute(lights, lightsNumComponents));
    this.geometry.setIndex(Array.from(indices));

    this.altMesh = new Mesh(this.geometry, this.engine.registry.material);
    this.altMesh.name = this.name;
    this.altMesh.renderOrder = 10000;
    this.altMesh.frustumCulled = false;

    // mark chunk as built mesh
    this.isMeshing = false;
  }

  private toLocal = (vx: number, vy: number, vz: number) => {
    return vec3.sub([0, 0, 0], [vx, vy, vz], this.minInner);
  };
}

export { Chunk };
