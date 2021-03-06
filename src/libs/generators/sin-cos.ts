import { Engine } from '../..';
import { Chunk } from '../../app';

import { Generator } from './generator';

class SinCosGenerator extends Generator {
  constructor(engine: Engine) {
    super(engine);

    this.useBlockID('dirt');
    this.useBlockID('grass');
    this.useBlockID('stone');
  }

  async generate(chunk: Chunk) {
    const { minOuter: min, maxOuter: max } = chunk;

    console.time(`generating: ${chunk.name}`);

    for (let vx = min[0]; vx < max[0]; vx++) {
      for (let vy = min[1]; vy < max[1]; vy++) {
        for (let vz = min[2]; vz < max[2]; vz++) {
          const voxel = this.getVoxelAt(vx, vy, vz);
          if (voxel) {
            chunk.setVoxel(vx, vy, vz, voxel);
          }
        }
      }
    }

    console.timeEnd(`generating: ${chunk.name}`);
  }

  getVoxelAt(vx: number, vy: number, vz: number) {
    let blockID = 0;

    if (vy < -3) blockID = this.getBlockID('stone');
    else {
      const height = 2 * Math.sin(vx / 10) + 3 * Math.cos(vz / 20) + 3;
      if (vy < height) {
        blockID = this.getBlockID('dirt');
      }
    }

    return blockID;
  }
}

export { SinCosGenerator };
