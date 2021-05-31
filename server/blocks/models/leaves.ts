import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const Leaves: BlockType = {
  name: 'leaves',
  ...BaseBlock,
  isTransparent: true,
  transparentStandalone: true,
  textures: {
    all: 'leaves_transparent.png',
  },
};

module.exports = Leaves;
