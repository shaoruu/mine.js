import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const GreyStone: BlockType = {
  name: 'greystone',
  ...BaseBlock,
  textures: {
    all: 'greystone.png',
  },
};

module.exports = GreyStone;
