import { BlockType } from '../../libs';

import { BasePlant } from './base-plant';

const Grass: BlockType = {
  ...BasePlant,
  name: 'grass',
  textures: {
    one: 'grass4.png',
    two: 'grass4.png',
  },
};

module.exports = Grass;
