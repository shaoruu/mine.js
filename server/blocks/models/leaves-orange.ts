import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const Leaves: BlockType = {
  name: 'leaves-orange',
  ...BaseBlock,
  textures: {
    all: 'leaves_orange_transparent.png',
  },
};

module.exports = Leaves;
