import { BlockType } from '../../libs';

import { BasePlant } from './base-plant';

const RedMushroom: BlockType = {
  ...BasePlant,
  name: 'red-mushroom',
  textures: {
    one: 'mushroom_red.png',
    two: 'mushroom_red.png',
  },
};

module.exports = RedMushroom;
