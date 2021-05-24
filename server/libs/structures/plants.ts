import { Coords3 } from '../../../shared/types';
import { Chunk, Mine, TERRAIN_CONFIG } from '../../core';
import { Noise } from '../noise';
import { VoxelUpdate } from '../types';

import { Base } from './base';

class Plants extends Base {
  constructor() {
    super([5, 5]);
  }

  isTreeLocation(vx: number, vz: number) {
    const noise3x3 = [];

    const {
      HILLY: { PLANT_SCALE },
    } = TERRAIN_CONFIG;

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        noise3x3.push(Noise.perlin2(vx + i, vz + j, PLANT_SCALE));
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

    // 2 more than trees
    return maxi === 3;
  }

  sample(chunk: Chunk) {
    const { min, max } = chunk;

    const [startX, , startZ] = min;
    const [endX, , endZ] = max;

    const locations: Coords3[] = [];

    for (let vx = startX; vx < endX; vx++) {
      for (let vz = startZ; vz < endZ; vz++) {
        const vy = chunk.getMaxHeight([vx, vz]);
        if (Mine.registry.isPlantable(chunk.getVoxel([vx, vy, vz])) && this.isTreeLocation(vx, vz)) {
          locations.push([vx, vy + 1, vz]);
        }
      }
    }

    return locations;
  }

  generate(chunk: Chunk) {
    const locations = this.sample(chunk);
    const types = Mine.registry.getTypeMap(['grass']);

    const updates: VoxelUpdate[] = [];

    for (const location of locations) {
      updates.push({ type: types.grass, voxel: location });
    }

    return updates;
  }
}

export { Plants };
