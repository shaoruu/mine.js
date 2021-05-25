import { BlockType } from '../../libs';

import { BasePlant } from './base-plant';

const TanMushroom: BlockType = {
  ...BasePlant,
  name: 'tan-mushroom',
  textures: {
    one: 'mushroom_tan.png',
    two: 'mushroom_tan.png',
  },
};

module.exports = TanMushroom;
