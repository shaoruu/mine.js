import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const Trunk: BlockType = {
  name: 'trunk',
  ...BaseBlock,
  textures: {
    top: 'trunk_top.png',
    side: 'trunk_side.png',
    bottom: 'trunk_top.png',
  },
};

module.exports = Trunk;
