import Noise from 'noisejs';

import { Coords3 } from '../../../shared/types';
import { Chunk, World, Mine, TERRAIN_CONFIG } from '../../core';
import { VoxelUpdate } from '../types';

import { Base } from './base';

// @ts-ignore
const noise: Noise = new Noise.Noise(13412);

class Tree extends Base {
  constructor(public world: World) {
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

  build(chunk: Chunk) {
    const locations = this.sample(chunk);
    const types = Mine.registry.getTypeMap(['trunk']);

    const updates: VoxelUpdate[] = [];

    for (const location of locations) {
      const [vx, vy, vz] = location;
      for (let i = 0; i < 4; i++) {
        updates.push({ voxel: [vx, vy + i, vz], type: types.trunk });
      }
    }

    this.world.updateMany(updates);
  }
}

export { Tree };
