import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const Glass: BlockType = {
  name: 'glass',
  ...BaseBlock,
  isTransparent: true,
  textures: {
    all: 'glass.png',
  },
};

module.exports = Glass;
