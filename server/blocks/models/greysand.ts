import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const GreySand: BlockType = {
  name: 'greysand',
  ...BaseBlock,
  textures: {
    all: 'greysand.png',
  },
};

module.exports = GreySand;
