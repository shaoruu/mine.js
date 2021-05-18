import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const Leaves: BlockType = {
  name: 'leaves',
  ...BaseBlock,
  textures: {
    all: 'leaves.png',
  },
};

module.exports = Leaves;
