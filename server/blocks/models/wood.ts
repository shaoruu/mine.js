import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const Wood: BlockType = {
  name: 'wood',
  ...BaseBlock,
  textures: {
    all: 'wood.png',
  },
};

module.exports = Wood;
