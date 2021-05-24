import { BlockType } from '../../libs';

import { BasePlant } from './base-plant';

const Grass: BlockType = {
  ...BasePlant,
  name: 'grass',
  textures: {
    one: 'grass1.png',
    two: 'grass1.png',
  },
};

module.exports = Grass;
