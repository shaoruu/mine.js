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
        noise3x3.push(Noise.fractalOctavePerlin2(vx + i, vz + j, PLANT_SCALE, 5));
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
        if (Mine.registry.isPlantable(chunk.getVoxel([vx, vy, vz])) && this.isTreeLocation(vx, vz)) {
          locations.push([vx, vy + 1, vz]);
        }
      }
    }

    return locations;
  }

  generate(chunk: Chunk) {
    const locations = this.sample(chunk);
    const types = Mine.registry.getTypeMap([
      'dirt',
      'grass',
      'tan-grass',
      'brown-grass',
      'brown-mushroom',
      'red-mushroom',
      'tan-mushroom',
    ]);

    const updates: VoxelUpdate[] = [];

    for (const location of locations) {
      const [vx, vy, vz] = location;
      const stand = chunk.getVoxel([vx, vy - 1, vz]);

      let type = types.grass;

      if (Noise.fractalOctavePerlin3(vx, vy, vz, 0.123, 3) > 0.3) type = types['red-mushroom'];
      else if (Noise.fractalOctavePerlin3(vx, vy, vz, 0.5852, 6) > 0.33 && stand === types.dirt)
        type = types['brown-mushroom'];
      else if (Noise.fractalOctavePerlin3(vx, vy, vz, 0.4512, 4) > 0.3) type = types['tan-grass'];
      else if (Noise.fractalOctavePerlin3(vx, vy, vz, 0.3245, 2) > 0.36) type = types['tan-mushroom'];
      else if (Noise.fractalOctavePerlin3(vx, vy, vz, 0.222, 1) > 0.25 && stand === types.dirt)
        type = types['brown-grass'];

      updates.push({ type, voxel: location });
    }

    return updates;
  }
}

export { Plants };
