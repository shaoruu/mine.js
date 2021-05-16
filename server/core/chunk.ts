import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import vec3 from 'gl-vec3';
import ndarray from 'ndarray';

import { Coords2, Coords3, Helper, MeshType } from '../../shared';

import { World, Mesher, Generator, Mine } from '.';

type ChunkOptionsType = {
  size: number;
  maxHeight: number;
  dimension: number;
};

type LightNode = {
  voxel: Coords3;
  level: number;
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

  public meshes: {
    opaque: MeshType | undefined;
    transparent: MeshType | undefined;
  } = { opaque: undefined, transparent: undefined };
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

    try {
      this.load();
    } catch (e) {
      this.generate();
    }
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
    if (!this.contains(vCoords)) return 0;
    const lCoords = this.toLocal(vCoords);
    return this.getLocalTorchLight(lCoords);
  }

  setTorchLight(vCoords: Coords3, level: number) {
    const lCoords = this.toLocal(vCoords);
    this.setLocalTorchLight(lCoords, level);
  }

  getSunlight(vCoords: Coords3) {
    if (!this.contains(vCoords)) return 0;
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
    if (height > this.topY) this.topY = height;
    return this.heightMap.set(...column, height);
  };

  contains = (voxel: Coords3, padding = 0) => {
    const { size, maxHeight } = this.options;
    const [lx, ly, lz] = this.toLocal(voxel);

    return lx >= -padding && lx < size + padding && ly >= 0 && ly < maxHeight && lz >= -padding && lz < size + padding;
  };

  load = () => {
    // load from existing files

    const fileBuffer = fs.readFileSync(
      path.join(this.world.storage, `${Helper.getChunkName(this.coords)}.json`),
      'utf8',
    );
    const { voxels, lights, needsPropagation } = JSON.parse(fileBuffer);
    this.needsSaving = false;
    this.needsPropagation = needsPropagation;
    this.voxels.data = zlib.inflateSync(Buffer.from(voxels, 'base64'));
    this.lights.data = zlib.inflateSync(Buffer.from(lights, 'base64'));
    this.generateHeightMap();
  };

  save = () => {
    // save to file system
    const { needsPropagation } = this;

    fs.writeFileSync(
      path.join(this.world.storage, `${Helper.getChunkName(this.coords)}.json`),
      JSON.stringify({
        needsPropagation,
        voxels: zlib.deflateSync(<Uint8Array>this.voxels.data).toString('base64'),
        lights: zlib.deflateSync(<Uint8Array>this.lights.data).toString('base64'),
      }),
    );

    this.needsSaving = false;
  };

  generate = () => {
    // generate terrain, height map, and mesh
    this.needsPropagation = true;
    this.needsSaving = true;
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
    // light propagation
    this.needsPropagation = false;

    const { world, min, max } = this;
    const { maxLightLevel } = world.options;

    const lightQueue: LightNode[] = [];
    const sunlightQueue: LightNode[] = [];

    const [startX, startY, startZ] = min;
    const [endX, endY, endZ] = max;

    for (let vz = startZ; vz < endZ; vz++) {
      for (let vx = startX; vx < endX; vx++) {
        const h = world.getMaxHeight([vx, vz]);
        for (let vy = endY - 1; vy >= startY; vy--) {
          const voxel = <Coords3>[vx, vy, vz];
          const blockType = world.getBlockTypeByVoxel(voxel);

          if (vy > h && blockType.isTransparent) {
            world.setSunlight(voxel, maxLightLevel);

            voxelHorizontalNeighbors.forEach(({ x: ox, z: oz }) => {
              if (!world.getTransparencyByVoxel([vx + ox, vy, vz + oz])) return;
              if (world.getMaxHeight([vx + ox, vz + oz]) > vy) {
                // means sunlight should propagate here horizontally
                if (!sunlightQueue.find(({ voxel: v }) => v[0] === voxel[0] && v[1] === voxel[1] && v[2] === voxel[2]))
                  sunlightQueue.push({
                    voxel: voxel,
                    level: maxLightLevel,
                  });
              }
            });
          } else if (blockType.isLight) {
            world.setTorchLight(voxel, blockType.lightLevel);
            lightQueue.push({
              voxel: voxel,
              level: blockType.lightLevel,
            });
          }
        }
      }
    }

    this.floodLight(lightQueue);
    this.floodLight(sunlightQueue, true);

    this.needsSaving = true;
  };

  floodLight = (queue: LightNode[], isSunlight = false) => {
    // flood light from source
    const { world } = this;
    const { maxHeight } = this.options;
    const { maxLightLevel } = world.options;

    while (queue.length) {
      const { voxel, level } = queue.shift();
      const [vx, vy, vz] = voxel;

      voxelNeighbors.forEach((offset) => {
        const nvy = vy + offset.y;

        if (nvy < 0 || nvy >= maxHeight) {
          return;
        }

        const nvx = vx + offset.x;
        const nvz = vz + offset.z;
        const sd = isSunlight && offset.y === -1 && level === maxLightLevel;
        const nl = level - (sd ? 0 : 1);
        const nVoxel = <Coords3>[nvx, nvy, nvz];
        const blockType = world.getBlockTypeByVoxel(nVoxel);

        if (
          !blockType.isTransparent ||
          // (isSunlight && offset.y !== -1 && level === maxLightLevel && nvy > world.getMaxHeight([nvx, nvz])) ||
          (isSunlight ? world.getSunlight(nVoxel) : world.getTorchLight(nVoxel)) >= nl
        ) {
          return;
        }

        if (isSunlight) {
          world.setSunlight(nVoxel, nl);
        } else {
          world.setTorchLight(nVoxel, nl);
        }

        world.markForSavingFromVoxel(nVoxel);

        queue.push({
          voxel: nVoxel,
          level: nl,
        });
      });
    }
  };

  removeLight = (voxel: Coords3, isSunlight = false) => {
    // remove light and back-propagate
    const { world } = this;
    const { maxHeight } = this.options;
    const { maxLightLevel } = world.options;

    const fill: LightNode[] = [];
    const queue: LightNode[] = [];

    queue.push({ voxel, level: isSunlight ? world.getSunlight(voxel) : world.getTorchLight(voxel) });

    if (isSunlight) {
      world.setSunlight(voxel, 0);
    } else {
      world.setTorchLight(voxel, 0);
    }

    world.markForSavingFromVoxel(voxel);

    while (queue.length) {
      const { voxel, level } = queue.shift();
      const [vx, vy, vz] = voxel;

      voxelNeighbors.forEach((offset) => {
        const nvy = vy + offset.y;

        if (nvy < 0 || nvy >= maxHeight) {
          return;
        }

        const nvx = vx + offset.x;
        const nvz = vz + offset.z;
        const nVoxel = <Coords3>[nvx, nvy, nvz];

        const nl = isSunlight ? world.getSunlight(nVoxel) : world.getTorchLight(nVoxel);

        if (nl === 0) {
          return;
        }

        // if level is less, or if sunlight is propagating downwards without stopping
        if (nl < level || (isSunlight && offset.y === -1 && level === maxLightLevel && nl === maxLightLevel)) {
          queue.push({
            voxel: nVoxel,
            level: nl,
          });
          if (isSunlight) world.setSunlight(nVoxel, 0);
          else world.setTorchLight(nVoxel, 0);
          world.markForSavingFromVoxel(nVoxel);
        } else if (nl >= level) {
          if (!isSunlight || offset.y !== -1 || nl > level)
            fill.push({
              voxel: nVoxel,
              level: nl,
            });
        }
      });
    }

    this.floodLight(fill, isSunlight);
  };

  update = (voxel: Coords3, type: number) => {
    // update blocks
    const { world, needsPropagation } = this;
    const { maxHeight } = this.options;
    const { maxLightLevel } = world.options;
    const { registry } = Mine;
    const [vx, vy, vz] = voxel;
    const height = world.getMaxHeight([vx, vz]);
    const currentType = world.getBlockTypeByVoxel(voxel);
    const updatedType = world.getBlockTypeByType(type);

    // updating the new block
    world.setVoxel(voxel, type);

    // update height map
    if (registry.isAir(type)) {
      if (vy === height) {
        // on max height, should set max height to lower
        for (let y = vy - 1; y >= 0; y--) {
          if (y === 0 || registry.isAir(world.getVoxelByVoxel([vx, y, vz]))) {
            world.setMaxHeight([vx, vz], y);
            break;
          }
        }
      }
    } else if (height < vy) {
      world.setMaxHeight([vx, vz], vy);
    }

    // update light levels
    if (!needsPropagation) {
      if (currentType.isLight) {
        // remove leftover light
        this.removeLight(voxel);
      } else if (currentType.isTransparent && !updatedType.isTransparent) {
        // remove light if solid block is placed.
        [false, true].forEach((isSunlight) => {
          const level = isSunlight ? world.getSunlight(voxel) : world.getTorchLight(voxel);
          if (level !== 0) {
            this.removeLight(voxel, isSunlight);
          }
        });
      }

      if (updatedType.isLight) {
        // placing a light
        world.setTorchLight(voxel, updatedType.lightLevel);
        this.floodLight([{ voxel, level: updatedType.lightLevel }]);
      } else if (updatedType.isTransparent && !currentType.isTransparent) {
        // solid block removed
        [false, true].forEach((isSunlight) => {
          const queue: LightNode[] = [];
          if (isSunlight && vy === maxHeight - 1) {
            // propagate sunlight down
            world.setSunlight(voxel, maxLightLevel);
            queue.push({
              voxel,
              level: maxLightLevel,
            });
          } else {
            voxelNeighbors.forEach((offset) => {
              const nvy = vy + offset.y;

              if (nvy < 0 || nvy >= maxHeight) {
                return;
              }

              const nvx = vx + offset.x;
              const nvz = vz + offset.z;
              const nVoxel = <Coords3>[nvx, nvy, nvz];
              const { isLight, isTransparent } = world.getBlockTypeByVoxel([nvx, nvy, nvz]);

              // need propagation after solid block removed
              const level = isSunlight ? world.getSunlight(nVoxel) : world.getTorchLight(nVoxel);
              if (level !== 0 && (isTransparent || (isLight && !isSunlight))) {
                queue.push({
                  voxel: nVoxel,
                  level,
                });
              }
            });
          }
          this.floodLight(queue, isSunlight);
        });
      }
    }

    this.needsSaving = true;
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
    this.meshes.opaque = Mesher.meshChunk(this);
    this.meshes.transparent = Mesher.meshChunk(this, true);
  };

  toLocal = (voxel: Coords3) => {
    return <Coords3>vec3.sub([0, 0, 0], voxel, this.min);
  };

  getProtocol(needsVoxels = false) {
    if (!this.hasMesh) this.remesh();

    return {
      x: this.coords[0],
      z: this.coords[1],
      meshes: [this.meshes],
      voxels: needsVoxels ? this.voxels.data : null,
    };
  }

  get hasMesh() {
    return !!this.meshes.opaque || !!this.meshes.transparent;
  }
}

export { Chunk };
