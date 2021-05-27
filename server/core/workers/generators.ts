import ndarray from 'ndarray';
import { Transfer, expose } from 'threads';

import { Coords3, TypeMap } from '../../../shared';
import { Noise } from '../../libs/noise';
import { GeneratorTypes } from '../../libs/types';
import { TERRAIN_CONFIG } from '../constants';

type GeneratorOptionsType = {
  maxHeight: number;
};

class Generators {
  static hilly = ([vx, vy, vz]: Coords3, types: TypeMap) => {
    const {
      HILLY: { OCTAVES, SCALE, PERSISTENCE, LACUNARITY, AMPLIFIER, HEIGHT_OFFSET, HEIGHT_SCALE },
    } = TERRAIN_CONFIG;

    vy = vy - HEIGHT_OFFSET;

    function isSolidAt(vx: number, vy: number, vz: number) {
      return (
        Noise.octavePerlin3(vx, vy, vz, SCALE, {
          octaves: OCTAVES,
          persistence: PERSISTENCE,
          lacunarity: LACUNARITY,
          amplifier: AMPLIFIER,
          heightScale: HEIGHT_SCALE,
        }) > -0.2
      );
    }

    const isSolid = isSolidAt(vx, vy, vz);
    const isSolidTop = isSolidAt(vx, vy + 1, vz);
    const isSolidTop2 = isSolidAt(vx, vy + 2, vz);

    let blockID = types.air;

    if (isSolid) {
      if (!isSolidTop && !isSolidTop2) {
        blockID = types['grass-block'];
        if (Noise.fractalOctavePerlin3(vx, vy, vz, SCALE) > 0.3) {
          blockID = types.dirt;
        }
        //  else if (Noise.simplex2(vx, vz, SCALE) > 0.05) blockID = types['grass-block'];

        // if (Noise.simplex2(vx, vz, SCALE) < 0.03 && Noise.perlin2(vz, vx, SCALE) > 0.06) {
        //   blockID = types.snow;
        // }

        // if (Noise.fractalOctavePerlin3(vx, vy, vz, SCALE) > 0.25) {
        //   blockID = types.green;
        // }
      } else {
        blockID = types.stone;
      }
    }

    return blockID;
  };

  static heightMap = () => {};

  static flat = ([, vy]: Coords3, types: TypeMap) => {
    if (vy === 6) return types['grass-block'];
    if (vy < 6 && vy > 3) return types.dirt;
    else if (vy <= 3) return types.stone;
    return types.air;
  };

  static sincos = ([vx, vy, vz]: Coords3, types: TypeMap, options: GeneratorOptionsType) => {
    const { maxHeight } = options;

    let blockID = types.air;

    if (vy >= maxHeight) return 0;
    if (vy === 0) return types.stone;

    const height1 = 5 * Math.sin(vx / 10) + 8 * Math.cos(vz / 20);
    const height2 = 0;
    if (vy < height1 && vy > height2) {
      blockID = Math.random() > 0.5 ? types['grass-block'] : types.stone;
    }

    return blockID;
  };
}

function generate(
  buffer: ArrayBuffer,
  min: Coords3,
  max: Coords3,
  generation: GeneratorTypes,
  types: TypeMap,
  options: GeneratorOptionsType,
) {
  const [startX, startY, startZ] = min;
  const [endX, endY, endZ] = max;

  const dimX = endX - startX;
  const dimY = endY - startY;
  const dimZ = endZ - startZ;

  const voxels = ndarray(new Uint8Array(buffer), [dimX, dimY, dimZ]);

  let isEmpty = true;

  for (let vx = startX, lx = 0; vx < endX; ++vx, ++lx) {
    for (let vz = startZ, lz = 0; vz < endZ; ++vz, ++lz) {
      for (let vy = startY, ly = 0; vy < endY; ++vy, ++ly) {
        let voxelID = 0;
        switch (generation) {
          case 'sin-cos':
            voxelID = Generators.sincos([vx, vy, vz], types, options);
            break;
          case 'flat':
            voxelID = Generators.flat([vx, vy, vz], types);
            break;
          case 'hilly':
            voxelID = Generators.hilly([vx, vy, vz], types);
        }

        if (voxelID !== 0) {
          isEmpty = false;
        }

        voxels.set(lx, ly, lz, voxelID);
      }
    }
  }

  return Transfer({ isEmpty, buffer }, [buffer]);
}

const generator = {
  generate,
};

export type Generator = typeof generator;

expose(generator);
