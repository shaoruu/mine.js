import TWEEN from '@tweenjs/tween.js';
import vec3 from 'gl-vec3';
import ndarray, { NdArray } from 'ndarray';
import { BufferGeometry, Float32BufferAttribute, Mesh, Group, Int32BufferAttribute, Box3, Vector3 } from 'three';
import pool from 'typedarray-pool';

import { ServerMeshType } from '../libs';
import { Coords3, Coords2 } from '../libs/types';
import { Helper } from '../utils';

import { Engine } from '.';

type ChunkOptions = {
  size: number;
  subChunks: number;
  maxHeight: number;
  dimension: number;
};

type ChunkMesh = Mesh & {
  isAdded?: boolean;
};

const MESH_TYPES = ['transparent', 'opaque'];
const DATA_PADDING = 1;

class Chunk {
  public voxels: NdArray;
  public lights: NdArray;

  public name: string;
  public size: number;
  public subChunks: number;
  public maxHeight: number;
  public dimension: number;
  public width: number;

  // voxel position references in voxel space
  public min: Coords3 = [0, 0, 0];
  public max: Coords3 = [0, 0, 0];

  public geometries: Map<string, BufferGeometry[]> = new Map();
  public meshes: Map<string, ChunkMesh[]> = new Map();
  public altMeshes: Map<string, ChunkMesh[]> = new Map();
  public mesh: Group;

  public isEmpty = true;
  public isDirty = true;
  public isAdded = false;
  public isMeshing = false; // is meshing
  public isInitialized = false; // is populated with terrain info
  public isPending = false; // pending for client-side terrain generation

  constructor(public engine: Engine, public coords: Coords2, { size, dimension, maxHeight, subChunks }: ChunkOptions) {
    this.size = size;
    this.subChunks = subChunks;
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

  getLocalRedLight = (lx: number, ly: number, lz: number) => {
    return (this.lights.get(lx, ly, lz) >> 8) & 0xf;
  };

  getLocalGreenLight = (lx: number, ly: number, lz: number) => {
    return (this.lights.get(lx, ly, lz) >> 4) & 0xf;
  };

  getLocalBlueLight = (lx: number, ly: number, lz: number) => {
    return this.lights.get(lx, ly, lz) & 0xf;
  };

  getLocalSunlight = (lx: number, ly: number, lz: number) => {
    return (this.lights.get(lx, ly, lz) >> 12) & 0xf;
  };

  getRedLight = (vx: number, vy: number, vz: number) => {
    const lCoords = this.toLocal(vx, vy, vz);
    return this.getLocalRedLight(...lCoords);
  };

  getGreenLight = (vx: number, vy: number, vz: number) => {
    const lCoords = this.toLocal(vx, vy, vz);
    return this.getLocalGreenLight(...lCoords);
  };

  getBlueLight = (vx: number, vy: number, vz: number) => {
    const lCoords = this.toLocal(vx, vy, vz);
    return this.getLocalBlueLight(...lCoords);
  };

  getSunlight = (vx: number, vy: number, vz: number) => {
    const lCoords = this.toLocal(vx, vy, vz);
    return this.getLocalSunlight(...lCoords);
  };

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

  addToScene = (check = false) => {
    const { rendering } = this.engine;

    rendering.scene.add(this.mesh);

    if (!this.isAdded || check) {
      MESH_TYPES.forEach((type) => {
        const altMesh = this.altMeshes.get(type);
        if (altMesh && altMesh.length) {
          altMesh.forEach((subMesh) => {
            if (subMesh && !subMesh.isAdded) {
              subMesh.isAdded = true;
              this.mesh.add(subMesh);
            }
          });
          this.meshes.set(type, altMesh);
        }
      });
      this.isAdded = true;

      if (!check) {
        this.animate();
      }
    }
  };

  removeFromScene = (animated = true) => {
    const { rendering } = this.engine;

    const remove = () => {
      rendering.scene.remove(this.mesh);

      if (this.isAdded) {
        MESH_TYPES.forEach((type) => {
          const mesh = this.meshes.get(type);
          if (mesh && mesh.length) {
            mesh.forEach((subMesh) => {
              if (subMesh && subMesh.isAdded) {
                this.mesh.remove(subMesh);
                subMesh.isAdded = false;
              }
            });
          }
        });
        this.isAdded = false;
      }
    };

    if (animated) {
      this.animate(true).onComplete(remove);
    } else {
      remove();
    }
  };

  dispose = () => {
    this.geometries.forEach((geo) => geo.forEach((g) => g.dispose()));
    pool.free(this.voxels.data);
    pool.free(this.lights.data);
  };

  setupMesh = (meshDataList: ServerMeshType[]) => {
    this.isMeshing = true;

    const subChunkUnit = this.maxHeight / this.subChunks;

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

        const { positions, indices, uvs, aos, lights } = meshData[type];

        const positionNumComponents = 3;
        const uvNumComponents = 2;
        const occlusionNumComponents = 1;
        const lightNumComponents = 1;

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
        geometry.setAttribute('light', new Int32BufferAttribute(lights, lightNumComponents));
        geometry.setIndex(Array.from(indices));

        const min = new Vector3(
          this.min[0] * this.dimension,
          subChunkUnit * i * this.dimension,
          this.min[2] * this.dimension,
        );
        const max = new Vector3(
          this.max[0] * this.dimension,
          subChunkUnit * (i + 1) * this.dimension,
          this.max[2] * this.dimension,
        );

        geometry.boundingBox = new Box3(min, max);

        const materials =
          type === 'opaque'
            ? [this.engine.registry.opaqueChunkMaterial]
            : this.engine.registry.transparentChunkMaterials;

        materials.forEach((material, j) => {
          const altMesh = new Mesh(geometry, material) as ChunkMesh;
          altMesh.name = this.name;
          altMesh.frustumCulled = false;
          altMesh.renderOrder = type === 'opaque' ? 1000 : 100;

          // for transparent meshes, the altMesh array goes something like:
          // [F, B, F, B, F, B, ...] 8 * 2 = 16 (front: F, back: B)
          // opaque arr looks like:
          // [F, F, F, F, F, F, ...] 8 * 1 = 8
          const temp = this.altMeshes.get(type)[i * (type === 'opaque' ? 1 : 2) + j];
          if (this.isAdded) {
            this.mesh.add(altMesh);
          }
          this.mesh.remove(temp);
          this.engine.rendering.scene.remove(temp);
          this.altMeshes.get(type)[i * (type === 'opaque' ? 1 : 2) + j] = altMesh;
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
