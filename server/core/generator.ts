import Noise from 'noisejs';

import { Coords3 } from '../../shared';

import { Chunk, TERRAIN_CONFIG, Mine } from '.';

type GeneratorTypes = 'sin-cos' | 'flat' | 'hilly';

let noise: Noise;

class Generator {
  static generate = (chunk: Chunk, type: GeneratorTypes) => {
    const { min, max, voxels } = chunk;

    const [startX, startY, startZ] = min;
    const [endX, endY, endZ] = max;

    const isEmpty = true;

    for (let vx = startX, lx = 0; vx < endX; ++vx, ++lx) {
      for (let vz = startZ, lz = 0; vz < endZ; ++vz, ++lz) {
        for (let vy = startY, ly = 0; vy < endY; ++vy, ++ly) {
          let voxelID = 0;
          switch (type) {
            case 'sin-cos':
              voxelID = Generator.sincos([vx, vy, vz], chunk);
              break;
            case 'flat':
              voxelID = Generator.flat([vx, vy, vz]);
              break;
            case 'hilly':
              voxelID = Generator.hilly([vx, vy, vz]);
          }

          voxels.set(lx, ly, lz, voxelID);
        }
      }
    }

    chunk.isEmpty = isEmpty;
  };

  static hilly = ([vx, vy, vz]: Coords3) => {
    const { registry } = Mine;

    if (!noise) {
      // @ts-ignore
      noise = new Noise.Noise(13412);
    }

    const {
      HILLY: { OCTAVES, SCALE, PERSISTANCE, LACUNARITY, AMPLIFIER, HEIGHT_OFFSET },
    } = TERRAIN_CONFIG;

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

    const isSolid = isSolidAt(vx, vy, vz);
    const isSolidTop = isSolidAt(vx, vy + 1, vz);
    const isSolidTop2 = isSolidAt(vx, vy + 2, vz);

    let blockID = types.air;

    if (isSolid) {
      if (!isSolidTop && !isSolidTop2) {
        blockID = types.grass;
      } else {
        blockID = types.stone;
      }
    }

    return blockID;
  };

  static heightMap = () => {};

  static flat = ([, vy]: Coords3) => {
    const { registry } = Mine;
    const types = registry.getTypeMap(['air', 'dirt', 'grass', 'stone']);
    if (vy === 6) return types.grass;
    if (vy < 6 && vy > 3) return types.dirt;
    else if (vy <= 3) return types.stone;
    return types.air;
  };

  static sincos = ([vx, vy, vz]: Coords3, chunk: Chunk) => {
    const { registry } = Mine;
    const {
      options: { maxHeight },
    } = chunk;

    const types = registry.getTypeMap(['air', 'dirt', 'stone', 'grass']);

    let blockID = types.air;

    if (vy >= maxHeight) return 0;
    if (vy === 0) return types.stone;

    const height1 = 5 * Math.sin(vx / 10) + 8 * Math.cos(vz / 20);
    const height2 = 0;
    if (vy < height1 && vy > height2) {
      blockID = Math.random() > 0.5 ? types.grass : types.stone;
    }

    return blockID;
  };
}

export { Generator, GeneratorTypes };
