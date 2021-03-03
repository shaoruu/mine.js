import ndarray from 'ndarray';
import { Engine } from '../..';
import { Coords3 } from '../types';
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

  generate(data: ndarray) {}

  getVoxelAt(voxel: Coords3) {
    const [_, y] = voxel;
    if (y <= this.options.height) return 1;
    return 0;
  }
}

export { FlatGenerator };
