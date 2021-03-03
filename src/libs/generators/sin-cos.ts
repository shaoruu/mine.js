import { Engine } from '../..';
import { Chunk } from '../../app';
import { Coords3 } from '../types';

import { Generator } from './generator';

class SinCosGenerator extends Generator {
  constructor(engine: Engine) {
    super(engine);
  }

  generate(chunk: Chunk) {
    const { voxels, base } = chunk;
    for (let i = 0; i < voxels.shape[0]; i++) {
      for (let j = 0; j < voxels.shape[1]; j++) {
        for (let k = 0; k < voxels.shape[2]; k++) {
          const voxel = this.getVoxelAt([base[0] + i, base[1] + j, base[2] + k]);
          voxels.set(voxel);
        }
      }
    }
  }

  getVoxelAt(voxel: Coords3) {
    const [vx, vy, vz] = voxel;

    const height = (Math.sin(vx * Math.PI * 4) + Math.sin(vz * Math.PI * 6)) * 20;

    if (height < vy + 1) {
      return 1;
    }

    return 0;
  }
}

export { SinCosGenerator };
