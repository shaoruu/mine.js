import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const StoneSlab: BlockType = {
  name: 'stone slab',
  ...BaseBlock,
  scale: [1, 0.5, 1],
  textures: {
    all: 'brick_grey.png',
  },
};

module.exports = StoneSlab;
