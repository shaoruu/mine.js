import { Engine } from '../..';
import { Chunk } from '../../app';

import { Generator } from './generator';

type FlatGeneratorOptions = {
  height: number;
};

const defaultFlatGeneratorOptions = {
  height: 5,
};

class FlatGenerator extends Generator {
  public options: FlatGeneratorOptions;

  constructor(engine: Engine, options: Partial<FlatGeneratorOptions> = {}) {
    super(engine);

    this.options = {
      ...defaultFlatGeneratorOptions,
      ...options,
    };
  }

  generate(chunk: Chunk) {}

  getVoxelAt(_: number, vy: number) {
    if (vy <= this.options.height) return 1;
    return 0;
  }
}

export { FlatGenerator };
