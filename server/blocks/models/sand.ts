import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const Sand: BlockType = {
  name: 'sand',
  ...BaseBlock,
  textures: {
    all: 'sand.png',
  },
};

module.exports = Sand;
