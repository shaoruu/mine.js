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
      noise = new Noise.Noise(Math.random());
    }

    const {
      HILLY: { OCTAVES, SCALE, PERSISTANCE, LACUNARITY, AMPLIFIER, HEIGHT_OFFSET },
    } = TERRAIN_CONFIG;

    const {
      min,
      max,
      voxels,
      options: { maxHeight },
    } = chunk;

    const [startX, startY, startZ] = min;
    const [endX, endY, endZ] = max;

    let isEmpty = true;

    function getOctaveSimplex3(x, y, z) {
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

      return (total / maxVal) * AMPLIFIER + HEIGHT_OFFSET;
    }

    function getVoxelAt(vx: number, vy: number, vz: number, maxHeight: number) {
      let blockID = 0;

      if (vy === 0) return 4;
      if (vy === maxHeight - 1) return 0;

      const perlinValue = getOctaveSimplex3(vx, vy, vz) - vy * SCALE;

      if (perlinValue > -0.2) {
        blockID = vy % 3 === 2 ? 2 : vy % 2 === 1 ? 1 : 3;
      }

      return blockID;
    }

    for (let vx = startX, lx = 0; vx < endX; ++vx, ++lx) {
      for (let vy = startY, ly = 0; vy < endY; ++vy, ++ly) {
        for (let vz = startZ, lz = 0; vz < endZ; ++vz, ++lz) {
          const voxel = getVoxelAt(vx, vy, vz, maxHeight);
          if (voxel) {
            isEmpty = false;
            voxels.set(lx, ly, lz, voxel);
          }
        }
      }
    }

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
