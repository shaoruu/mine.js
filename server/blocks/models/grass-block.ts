import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const GrassBlock: BlockType = {
  ...BaseBlock,
  name: 'grass-block',
  textures: {
    top: 'grass_top.png',
    side: 'grass_side.png',
    bottom: 'dirt.png',
  },
};

module.exports = GrassBlock;
