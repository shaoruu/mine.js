import Noise from 'noisejs';

import { TypeMap } from '../../shared';

import { Chunk, TERRAIN_CONFIG } from '.';

type GeneratorTypes = 'sin-cos' | 'flat' | 'hilly';

let noise: Noise;

class Generator {
  static generate = (chunk: Chunk, type: GeneratorTypes) => {
    switch (type) {
      case 'sin-cos':
        Generator.sincos(chunk);
        break;
      case 'flat':
        Generator.flat(chunk);
        break;
      case 'hilly':
        Generator.hilly(chunk);
    }
  };

  static hilly = (chunk: Chunk) => {
    if (!noise) {
      // @ts-ignore
      noise = new Noise.Noise(1000);
    }

    const {
      HILLY: { OCTAVES, SCALE, PERSISTANCE, LACUNARITY, AMPLIFIER, HEIGHT_OFFSET },
    } = TERRAIN_CONFIG;

    const {
      min,
      max,
      voxels,
      world: { registry },
    } = chunk;

    const [startX, startY, startZ] = min;
    const [endX, endY, endZ] = max;

    let isEmpty = true;

    const types = registry.getTypeMap(['dirt', 'grass', 'stone']);

    function getOctaveSimplex3(x: number, y: number, z: number) {
      let total = 0;
      let frequency = 1;
      let amplitude = 1;
      let maxVal = 0;

      for (let i = 0; i < OCTAVES; i++) {
        total += noise.simplex3(x * frequency * SCALE, y * frequency * SCALE, z * frequency * SCALE) * amplitude;

        maxVal += amplitude;

        amplitude *= PERSISTANCE;
        frequency *= LACUNARITY;
      }

      return (total / maxVal) * AMPLIFIER + HEIGHT_OFFSET - y * SCALE;
    }

    function isSolidAt(vx: number, vy: number, vz: number) {
      return getOctaveSimplex3(vx, vy, vz) > -0.2;
    }

    // basic shapes
    for (let vx = startX, lx = 0; vx < endX; ++vx, ++lx) {
      for (let vz = startZ, lz = 0; vz < endZ; ++vz, ++lz) {
        for (let vy = startY, ly = 0; vy < endY; ++vy, ++ly) {
          const isSolid = isSolidAt(vx, vy, vz);
          const isSolidTop = isSolidAt(vx, vy + 1, vz);
          const isSolidTop2 = isSolidAt(vx, vy + 2, vz);

          if (isSolid) {
            isEmpty = false;
            if (!isSolidTop && !isSolidTop2) {
              voxels.set(lx, ly, lz, types.grass);
              if (getOctaveSimplex3(vx, vy, vz) > -0.195) {
                voxels.set(lx, ly - 1, lz, types.dirt);
                if (getOctaveSimplex3(vx, vy, vz) > -0.197) {
                  voxels.set(lx, ly - 2, lz, types.dirt);
                }
              }
            } else {
              voxels.set(lx, ly, lz, types.stone);
            }
          }
        }
      }
    }

    // chunk.generateHeightMap();

    // // surface painting
    // for (let vx = startX; vx < endX; ++vx) {
    //   for (let vz = startZ; vz < endZ; ++vz) {
    //     const columnHeight = chunk.getMaxHeight([vx, vz]);
    //     chunk.setVoxel([vx, columnHeight, vz], types.grass);
    //   }
    // }

    chunk.isEmpty = isEmpty;
  };

  static flat = (chunk: Chunk) => {
    // TODO
    const {} = chunk;
  };

  static sincos = (chunk: Chunk) => {
    const {
      voxels,
      min,
      max,
      options: { maxHeight },
      world: { registry },
    } = chunk;

    const [startX, startY, startZ] = min;
    const [endX, endY, endZ] = max;

    let isEmpty = true;

    const types = registry.getTypeMap(['air', 'dirt', 'stone', 'grass']);

    function getVoxelAt(vx: number, vy: number, vz: number, types: TypeMap, maxHeight: number) {
      let blockID = types.air;

      if (vy >= maxHeight) return 0;
      if (vy === 0) return types.stone;

      const height1 = 5 * Math.sin(vx / 10) + 8 * Math.cos(vz / 20);
      const height2 = 0;
      if (vy < height1 && vy > height2) {
        blockID = Math.random() > 0.5 ? types.grass : types.stone;
      }

      return blockID;
    }

    for (let vx = startX, lx = 0; vx < endX; ++vx, ++lx) {
      for (let vy = startY, ly = 0; vy < endY; ++vy, ++ly) {
        for (let vz = startZ, lz = 0; vz < endZ; ++vz, ++lz) {
          const voxel = getVoxelAt(vx, vy, vz, types, maxHeight);
          if (voxel) {
            isEmpty = false;
            voxels.set(lx, ly, lz, voxel);
          }
        }
      }
    }

    chunk.isEmpty = isEmpty;
  };
}

export { Generator, GeneratorTypes };
