import ndarray from 'ndarray';

import { Engine } from '../..';
import { Chunk } from '../../app';
import { Coords3 } from '../types';

import { Generator } from './generator';

class DefaultGenerator extends Generator {
  constructor(engine: Engine) {
    super(engine);
  }

  generate(chunk: Chunk) {}

  getVoxelAt(vx: number, vy: number, vz: number) {
    // TODO: Implement perlin noise and stuff.
    return 0;
  }
}

export { DefaultGenerator };
