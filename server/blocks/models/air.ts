import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const Air: BlockType = {
  name: 'air',
  ...BaseBlock,
  isEmpty: true,
  isSolid: false,
  isTransparent: true,
  isBlock: false,
};

module.exports = Air;
