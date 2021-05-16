import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const StoneBrick: BlockType = {
  name: 'stone brick',
  ...BaseBlock,
  textures: {
    all: 'brick_grey.png',
  },
};

module.exports = StoneBrick;
