import { Engine } from '../..';
import { Chunk } from '../../app';

import { Generator } from './generator';

class SinCosGenerator extends Generator {
  constructor(engine: Engine) {
    super(engine);
  }

  async generate(chunk: Chunk) {
    const { minOuter: min, maxOuter: max } = chunk;

    console.log(`generating: ${chunk.name}`);

    for (let vx = min[0]; vx < max[0]; vx++) {
      for (let vy = min[1]; vy < max[1]; vy++) {
        for (let vz = min[2]; vz < max[2]; vz++) {
          const voxel = this.getVoxelAt(vx, vy, vz);
          chunk.setVoxel(vx, vy, vz, voxel);
        }
      }
    }

    chunk.initialized();
  }

  getVoxelAt(vx: number, vy: number, vz: number) {
    if (vy < -3) return 2;

    const height = 2 * Math.sin(vx / 10) + 3 * Math.cos(vz / 20) + 3;
    if (vy < height) {
      return 1;
    }

    return 0;
  }
}

export { SinCosGenerator };
