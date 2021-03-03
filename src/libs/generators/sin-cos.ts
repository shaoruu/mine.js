import ndarray from 'ndarray';
import { Engine } from '../..';
import { Coords3 } from '../types';
import { Generator } from './generator';

class SinCosGenerator extends Generator {
  constructor(engine: Engine) {
    super(engine);
  }

  generate(data: ndarray) {}

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
