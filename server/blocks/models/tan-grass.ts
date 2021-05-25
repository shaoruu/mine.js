import { BlockType } from '../../libs';

import { BasePlant } from './base-plant';

const TanGrass: BlockType = {
  ...BasePlant,
  name: 'tan-grass',
  textures: {
    one: 'grass_tan.png',
    two: 'grass_tan.png',
  },
};

module.exports = TanGrass;
