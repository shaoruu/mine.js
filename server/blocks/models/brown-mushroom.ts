import { BlockType } from '../../libs';

import { BasePlant } from './base-plant';

const BrownMushroom: BlockType = {
  ...BasePlant,
  name: 'brown-mushroom',
  textures: {
    one: 'mushroom_brown.png',
    two: 'mushroom_brown.png',
  },
};

module.exports = BrownMushroom;
