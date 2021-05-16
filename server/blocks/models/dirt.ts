import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const Dirt: BlockType = {
  name: 'dirt',
  ...BaseBlock,
  textures: {
    all: 'dirt.png',
  },
};

module.exports = Dirt;
