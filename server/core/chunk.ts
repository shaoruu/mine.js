import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import vec3 from 'gl-vec3';
import ndarray from 'ndarray';

import { Coords2, Coords3, Helper, MeshType } from '../../shared';

import { World, Mesher, Generator } from '.';

type ChunkOptionsType = {
  size: number;
  maxHeight: number;
  dimension: number;
};

const voxelNeighbors = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
];

const voxelHorizontalNeighbors = [
  { x: -1, z: 0 },
  { x: 1, z: 0 },
  { x: 0, z: -1 },
  { x: 0, z: 1 },
];

class Chunk {
  public voxels: ndarray;
  public lights: ndarray;
  public heightMap: ndarray;

  public name: string;

  public min: Coords3 = [0, 0, 0];
  public max: Coords3 = [0, 0, 0];

  public needsSaving = false;
  public needsPropagation = false;
  public isEmpty = true;

  public mesh: MeshType;
  public topY: number = Number.MIN_SAFE_INTEGER;

  constructor(public coords: Coords2, public world: World, public options: ChunkOptionsType) {
    const { size, maxHeight } = options;
    const [cx, cz] = coords;
    const coords3 = [cx, 0, cz];

    this.name = Helper.getChunkName(coords);

    this.voxels = ndarray(new Uint8Array(size * maxHeight * size), [size, maxHeight, size]);
    this.lights = ndarray(new Uint8Array(size * maxHeight * size), [size, maxHeight, size]);
    this.heightMap = ndarray(new Uint8Array(size * size), [size, size]);

    vec3.copy(this.min, coords3);
    vec3.copy(this.max, coords3);
    vec3.scale(this.min, this.min, size);
    vec3.add(this.max, this.max, [1, 0, 1]);
    vec3.scale(this.max, this.max, size);
    vec3.add(this.max, this.max, [0, maxHeight, 0]);

    this.generate();
    // try {
    //   this.load();
    // } catch (e) {
    //   this.generate();
    // }
  }

  getVoxel = (voxel: Coords3) => {
    return this.voxels.get(...this.toLocal(voxel));
  };

  setVoxel = (voxel: Coords3, type: number) => {
    return this.voxels.set(...this.toLocal(voxel), type);
  };

  getLocalTorchLight(lCoords: Coords3) {
    return this.lights.get(...lCoords) & 0xf;
  }

  setLocalTorchLight(lCoords: Coords3, level: number) {
    return this.lights.set(...lCoords, (this.lights.get(...lCoords) & 0xf0) | level);
  }

  getLocalSunlight(lCoords: Coords3) {
    return (this.lights.get(...lCoords) >> 4) & 0xf;
  }

  setLocalSunlight(lCoords: Coords3, level: number) {
    return this.lights.set(...lCoords, (this.lights.get(...lCoords) & 0xf) | (level << 4));
  }

  getTorchLight(vCoords: Coords3) {
    const lCoords = this.toLocal(vCoords);
    return this.getLocalTorchLight(lCoords);
  }

  setTorchLight(vCoords: Coords3, level: number) {
    const lCoords = this.toLocal(vCoords);
    this.setLocalTorchLight(lCoords, level);
  }

  getSunlight(vCoords: Coords3) {
    const lCoords = this.toLocal(vCoords);
    return this.getLocalSunlight(lCoords);
  }

  setSunlight(vCoords: Coords3, level: number) {
    const lCoords = this.toLocal(vCoords);
    this.setLocalSunlight(lCoords, level);
  }

  getMaxHeight = (column: Coords2) => {
    const [lx, , lz] = this.toLocal([column[0], 0, column[1]]);
    return this.heightMap.get(lx, lz);
  };

  setMaxHeight = (column: Coords2, height: number) => {
    return this.heightMap.set(...column, height);
  };

  contains = (voxel: Coords3, padding = 0) => {
    const { size, maxHeight } = this.options;
    const [lx, ly, lz] = this.toLocal(voxel);

    return lx >= -padding && lx < size + padding && ly >= 0 && ly < maxHeight && lz >= -padding && lz < size + padding;
  };

  load = () => {
    // load from existing files

    const {
      options: { storage },
    } = this.world;

    const fileBuffer = fs.readFileSync(path.join(storage, `${Helper.getChunkName(this.coords)}.json`), 'utf8');
    const { voxels, lights } = JSON.parse(fileBuffer);
    this.needsSaving = false;
    this.voxels.data = zlib.inflateSync(Buffer.from(voxels, 'base64'));
    this.lights.data = zlib.inflateSync(Buffer.from(lights, 'base64'));
    this.generateHeightMap();
  };

  save = () => {
    // save to file system
    const {
      options: { storage },
    } = this.world;

    fs.writeFileSync(
      path.join(storage, `${Helper.getChunkName(this.coords)}.json`),
      JSON.stringify({
        voxels: zlib.deflateSync(this.voxels.data as Uint8Array).toString('base64'),
        lights: zlib.deflateSync(this.lights.data as Uint8Array).toString('base64'),
      }),
    );

    this.needsSaving = false;
  };

  generate = () => {
    // generate terrain, height map, and mesh
    this.needsPropagation = true;
    const { generation } = this.world.options;
    Generator.generate(this, generation);
    // TODO: lighting
    this.generateHeightMap();
    this.save();
  };

  generateHeightMap = () => {
    // generate 2d height map for lighting
    const { size, maxHeight } = this.options;

    for (let lx = 0; lx < size; lx++) {
      for (let lz = 0; lz < size; lz++) {
        for (let ly = maxHeight - 1; ly >= 0; ly--) {
          // TODO: air check
          if (ly === 0 || this.voxels.get(lx, ly, lz) !== 0) {
            if (this.topY < ly) this.topY = ly;
            this.heightMap.set(lx, lz, ly);
            break;
          }
        }
      }
    }
  };

  // huge help from https://github.com/danielesteban/blocks/blob/master/server/chunk.js
  propagate = () => {
    console.time(this.name);
    // light propagation
    this.needsPropagation = false;

    const { world, min, max } = this;
    const { maxLightLevel } = world.options;

    const lightQueue: Coords3[] = [];
    const sunlightQueue: Coords3[] = [];

    const [startX, startY, startZ] = min;
    const [endX, endY, endZ] = max;

    for (let vz = startZ; vz < endZ; vz++) {
      for (let vx = startX; vx < endX; vx++) {
        const h = world.getMaxHeight([vx, vz]);
        for (let vy = endY - 1; vy >= startY; vy--) {
          const voxel = [vx, vy, vz] as Coords3;
          const blockType = world.getBlockTypeByVoxel(voxel);

          if (vy > h) {
            world.setSunlight(voxel, maxLightLevel);

            voxelHorizontalNeighbors.forEach(({ x: ox, z: oz }) => {
              if (this.contains([vx + ox, vy, vz + oz])) {
                if (world.getMaxHeight([vx + ox, vz + oz]) > vy) {
                  // means sunlight should propagate here horizontally
                  sunlightQueue.push(voxel);
                }
              }
            });
          } else if (blockType.isLight) {
            world.setTorchLight(voxel, blockType.lightLevel);
            lightQueue.push(voxel);
          }
        }
      }
    }

    this.floodLight(lightQueue);
    this.floodLight(sunlightQueue, true);
    console.timeEnd(this.name);

    // todo: save
  };

  floodLight = (queue: Coords3[], isSunlight = false) => {
    // flood light from source
    const { world } = this;
    const { maxHeight } = this.options;
    const { registry } = world;
    const { maxLightLevel } = world.options;

    while (queue.length) {
      const voxel = queue.shift();
      const [vx, vy, vz] = voxel;
      const light = isSunlight ? world.getSunlight(voxel) : world.getTorchLight(voxel);

      voxelNeighbors.forEach((offset) => {
        const ny = vy + offset.y;

        if (ny < 0 || ny >= maxHeight) {
          return;
        }

        const nx = vx + offset.x;
        const nz = vz + offset.z;
        const sd = isSunlight && offset.y === -1 && light === maxLightLevel;
        const nl = light - (sd ? 0 : 1);
        const nVoxel = [nx, ny, nz] as Coords3;
        const typeID = world.getVoxelByVoxel(nVoxel);
        const blockType = registry.getBlockByID(typeID);

        if (
          !blockType.isTransparent ||
          (isSunlight && offset.y !== -1 && light === maxLightLevel && ny > world.getMaxHeight([nx, nz])) ||
          (isSunlight ? world.getSunlight(nVoxel) : world.getTorchLight(nVoxel)) >= nl
        ) {
          return;
        }

        if (isSunlight) {
          world.setSunlight(nVoxel, nl);
        } else {
          world.setTorchLight(nVoxel, nl);
        }

        queue.push(nVoxel);
      });
    }
  };

  removeLight = () => {
    // remove light and back-propagate
  };

  update = () => {
    // update a voxel and rebuild mesh
  };

  remesh = () => {
    // rebuild mesh
    // propagate light first
    // console.time(this.name);
    if (this.needsPropagation) this.propagate();

    // propagate neighbor chunks
    this.world.getNeighborChunks(this.coords).forEach((neighbor) => {
      if (neighbor.needsPropagation) {
        neighbor.propagate();
      }
    });
    // console.timeEnd(this.name);

    // mesh TODO: sub chunk meshes
    this.mesh = Mesher.meshChunk(this);
  };

  toLocal = (voxel: Coords3) => {
    return vec3.sub([0, 0, 0], voxel, this.min) as Coords3;
  };

  get protocol() {
    if (!this.mesh) this.remesh();

    return {
      x: this.coords[0],
      z: this.coords[1],
      meshes: [
        {
          opaque: this.mesh,
        },
      ],
      voxels: this.voxels.data,
    };
  }
}

export { Chunk };
