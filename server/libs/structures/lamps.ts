import { Coords3 } from '../../../shared/types';
import { Chunk, Mine } from '../../core';
import { Noise } from '../noise';
import { VoxelUpdate } from '../types';

import { Base } from './base';

const LAMP_SCALE = 0.02;

class Lamps extends Base {
  constructor() {
    super([5, 5]);
  }

  isLampLocation(vx: number, vz: number) {
    const noise3x3 = [];

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        noise3x3.push(Noise.simplex2(vx + i, vz + j, LAMP_SCALE));
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

  sample(chunk: Chunk) {
    const { min, max } = chunk;

    const [startX, , startZ] = min;
    const [endX, , endZ] = max;

    const locations: Coords3[] = [];

    for (let vx = startX; vx < endX; vx++) {
      for (let vz = startZ; vz < endZ; vz++) {
        const vy = chunk.getMaxHeight([vx, vz]);
        if (this.isLampLocation(vx, vz)) {
          locations.push([vx, vy + 1, vz]);
        }
      }
    }

    return locations;
  }

  generate(chunk: Chunk) {
    const locations = this.sample(chunk);
    const types = Mine.registry.getTypeMap(['stone', 'yellow']);

    const updates: VoxelUpdate[] = [];

    for (const location of locations) {
      updates.push({
        voxel: location,
        type: types.yellow,
      });
    }

    return updates;
  }
}

export { Lamps };
