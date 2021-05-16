import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const Stone: BlockType = {
  name: 'stone',
  ...BaseBlock,
  textures: {
    all: 'stone.png',
  },
};

module.exports = Stone;
