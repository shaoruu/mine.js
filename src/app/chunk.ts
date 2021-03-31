import vec3 from 'gl-vec3';
import ndarray from 'ndarray';
import { BufferAttribute, BufferGeometry, Mesh } from 'three';

import { Engine } from '..';
import { Coords2, Coords3 } from '../libs';
import { simpleCull } from '../libs/meshers';
import { makeHeightMap } from '../libs/meshers/make-height-map';
import { Helper } from '../utils';

type ChunkOptions = {
  size: number;
  maxHeight: number;
  dimension: number;
  padding: number;
};

class Chunk {
  public engine: Engine;
  public coords: Coords2;
  public voxels: ndarray;
  public lights: ndarray;
  public heightMap: ndarray;

  public name: string;
  public size: number;
  public maxHeight: number;
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
  public sunlightApplied = false;

  constructor(engine: Engine, coords: Coords2, { size, dimension, padding, maxHeight }: ChunkOptions) {
    this.engine = engine;
    this.coords = coords;

    this.size = size;
    this.maxHeight = maxHeight;
    this.dimension = dimension;
    this.padding = padding;
    this.width = size + padding * 2;
    this.name = Helper.getChunkName(this.coords);

    this.voxels = ndarray(new Int8Array(this.width * this.maxHeight * this.width), [
      this.width,
      this.maxHeight,
      this.width,
    ]);
    this.lights = ndarray(new Int8Array(this.width * this.maxHeight * this.width), [
      this.width,
      this.maxHeight,
      this.width,
    ]);
    this.heightMap = ndarray(new Int8Array(this.width * this.width), [this.width, this.width]);

    this.geometry = new BufferGeometry();

    this.minInner = [0, 0, 0];
    this.minOuter = [0, 0, 0];
    this.maxInner = [0, 0, 0];
    this.maxOuter = [0, 0, 0];

    const [cx, cz] = coords;
    const coords3 = [cx, 0, cz];

    // initialize
    vec3.copy(this.minInner, coords3);
    vec3.copy(this.minOuter, coords3);
    vec3.copy(this.maxInner, coords3);
    vec3.copy(this.maxOuter, coords3);

    // calculate
    const paddingVec = [padding, 0, padding];
    vec3.scale(this.minOuter, this.minOuter, size);
    vec3.sub(this.minOuter, this.minOuter, paddingVec);
    vec3.add(this.minInner, this.minOuter, paddingVec);
    vec3.add(this.maxOuter, this.maxOuter, [1, 0, 1]);
    vec3.scale(this.maxOuter, this.maxOuter, size);
    vec3.add(this.maxOuter, this.maxOuter, [0, maxHeight, 0]);
    vec3.add(this.maxOuter, this.maxOuter, paddingVec);
    vec3.sub(this.maxInner, this.maxOuter, paddingVec);
  }

  // goes from [-padding, 0, -padding] to [size + padding - 1, maxHeight - 1, size + padding - 1]
  getLocal(lx: number, ly: number, lz: number) {
    return this.voxels.get(lx + this.padding, ly, lz + this.padding);
  }

  // goes from [-padding, 0, -padding] to [size + padding - 1, maxHeight - 1, size + padding - 1]
  setLocal(lx: number, ly: number, lz: number, id: number) {
    return this.voxels.set(lx + this.padding, ly, lz + this.padding, id);
  }

  // goes from [-padding, 0, -padding] to [size + padding - 1, maxHeight - 1, size + padding - 1]
  getLocalTorchLight(lx: number, ly: number, lz: number) {
    return this.lights.get(lx + this.padding, ly, lz + this.padding) & 0xf;
  }

  // goes from [-padding, 0, -padding] to [size + padding - 1, maxHeight - 1, size + padding - 1]
  setLocalTorchLight(lx: number, ly: number, lz: number, level: number) {
    return this.lights.set(
      lx + this.padding,
      ly,
      lz + this.padding,
      (this.getLocalTorchLight(lx, ly, lz) & 0xf0) | level,
    );
  }

  // goes from [-padding, 0, -padding] to [size + padding - 1, maxHeight - 1, size + padding - 1]
  getLocalSunlight(lx: number, ly: number, lz: number) {
    return (this.lights.get(lx + this.padding, ly, lz + this.padding) >> 4) & 0xf;
  }

  // goes from [-padding, 0, -padding] to [size + padding - 1, maxHeight - 1, size + padding - 1]
  setLocalSunlight(lx: number, ly: number, lz: number, level: number) {
    return this.lights.set(
      lx + this.padding,
      ly,
      lz + this.padding,
      (this.getLocalSunlight(lx, ly, lz) & 0xf) | (level << 4),
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

  getSunlight(vx: number, vy: number, vz: number) {
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    return this.getLocalSunlight(lx, ly, lz);
  }

  setSunlight(vx: number, vy: number, vz: number, level: number) {
    if (!this.contains(vx, vy, vz)) return;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);
    this.setLocalSunlight(lx, ly, lz, level);
    this.isDirty = true;
  }

  contains(vx: number, vy: number, vz: number, padding = this.padding) {
    const { size, maxHeight } = this;
    const [lx, ly, lz] = this.toLocal(vx, vy, vz);

    return lx >= -padding && lx < size + padding && ly >= 0 && ly < maxHeight && lz >= -padding && lz < size + padding;
  }

  distTo(vx: number, _: number, vz: number) {
    const [mx, , mz] = this.minInner;
    return Math.sqrt((mx - vx) * (mx - vx) + (mz - vz) * (mz - vz));
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

    // build mesh once initialized
    await makeHeightMap(this);
    // await this.engine.world.applySunlight(this);
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

    const { positions, normals, indices, uvs, aos, sunlights, torchLights } = await simpleCull(this);

    const positionNumComponents = 3;
    const normalNumComponents = 3;
    const uvNumComponents = 2;
    const occlusionNumComponents = 1;
    const sunlightsNumComponents = 1;
    const torchLightsNumComponents = 1;

    this.geometry.dispose();
    this.geometry.setAttribute('position', new BufferAttribute(positions, positionNumComponents));
    this.geometry.setAttribute('normal', new BufferAttribute(normals, normalNumComponents));
    this.geometry.setAttribute('uv', new BufferAttribute(uvs, uvNumComponents));
    this.geometry.setAttribute('ao', new BufferAttribute(aos, occlusionNumComponents));
    this.geometry.setAttribute('sunlight', new BufferAttribute(sunlights, sunlightsNumComponents));
    this.geometry.setAttribute('torchLight', new BufferAttribute(torchLights, torchLightsNumComponents));
    this.geometry.setIndex(Array.from(indices));

    this.altMesh = new Mesh(this.geometry, this.engine.registry.material);
    this.altMesh.name = this.name;
    this.altMesh.renderOrder = 10000;
    this.altMesh.frustumCulled = false;

    // mark chunk as built mesh
    this.isMeshing = false;
    this.isPending = false;
  }

  private toLocal = (vx: number, vy: number, vz: number) => {
    return vec3.sub([0, 0, 0], [vx, vy, vz], this.minInner);
  };
}

export { Chunk };
