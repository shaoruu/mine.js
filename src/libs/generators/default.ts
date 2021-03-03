import ndarray from 'ndarray';
import { Engine } from '../..';
import { Coords3 } from '../types';
import { Generator } from './generator';

class DefaultGenerator extends Generator {
  constructor(engine: Engine) {
    super(engine);
  }

  generate(data: ndarray) {}

  getVoxelAt(voxel: Coords3) {
    // TODO: Implement perlin noise and stuff.
    return 0;
  }
}

export { DefaultGenerator };
