import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const Ice: BlockType = {
  name: 'ice',
  ...BaseBlock,
  textures: {
    all: 'ice.png',
  },
};

module.exports = Ice;
