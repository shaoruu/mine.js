import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const Grass: BlockType = {
  ...BaseBlock,
  name: 'grass',
  textures: {
    top: 'grass_top.png',
    side: 'grass_side.png',
    bottom: 'dirt.png',
  },
};

module.exports = Grass;
