import Noise from 'noisejs';

import { Coords3 } from '../../../shared/types';
import { Chunk, Mine, TERRAIN_CONFIG } from '../../core';
import { VoxelUpdate } from '../types';

import { Base } from './base';

// @ts-ignore
const noise: Noise = new Noise.Noise(13412);

class Tree extends Base {
  constructor() {
    super([5, 5]);
  }

  shouldPlantTree(vx: number, vz: number) {
    const noise3x3 = [];

    const {
      HILLY: { TREE_SCALE },
    } = TERRAIN_CONFIG;

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        noise3x3.push(noise.perlin2((vx + i) * TREE_SCALE, (vz + j) * TREE_SCALE));
      }
    }

    let max = noise3x3[0];
    let maxi = 0;

    for (let i = 1; i < noise3x3.length; i++) {
      if (max < noise3x3[i]) {
        max = noise3x3[i];
        maxi = i;
      }
    }

    return maxi === 4;
  }

  plantTree() {}

  sample(chunk: Chunk) {
    const { min, max } = chunk;

    const [startX, , startZ] = min;
    const [endX, , endZ] = max;

    const locations: Coords3[] = [];

    for (let vx = startX; vx < endX; vx++) {
      for (let vz = startZ; vz < endZ; vz++) {
        if (this.shouldPlantTree(vx, vz)) {
          locations.push([vx, chunk.getMaxHeight([vx, vz]), vz]);
        }
      }
    }

    return locations;
  }

  generate(chunk: Chunk) {
    const locations = this.sample(chunk);
    const types = Mine.registry.getTypeMap(['trunk', 'leaves']);

    const updates: VoxelUpdate[] = [];

    for (const location of locations) {
      const [vx, vy, vz] = location;
      const height = 4;
      for (let i = 0; i < height; i++) {
        updates.push({ voxel: [vx, vy + i, vz], type: types.trunk });
      }
      const [tbx, tby, tbz] = [vx, vy + height, vz];
      const bushSize = 3;
      const bushHeight = 3;
      for (let j = 0; j <= bushHeight; j++) {
        for (let i = -bushSize - j; i <= bushSize + j; i++) {
          for (let k = -bushSize - j; k <= bushSize + j; k++) {
            if (i < -bushSize || i > bushSize || k < -bushSize || k > bushSize) {
              if (noise.perlin3((vx + i) / 2, (vy + j) / 2, (vz + k) / 2) < 0.2) continue;
            }
            updates.push({ voxel: [tbx + i, tby + j, tbz + k], type: types.leaves });
          }
        }
      }
    }

    return updates;
  }
}

export { Tree };
