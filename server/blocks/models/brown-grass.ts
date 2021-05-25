import { BlockType } from '../../libs';

import { BasePlant } from './base-plant';

const BrownGrass: BlockType = {
  ...BasePlant,
  name: 'brown-grass',
  textures: {
    one: 'grass_brown.png',
    two: 'grass_brown.png',
  },
};

module.exports = BrownGrass;
