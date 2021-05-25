import { BlockType } from '../../libs';

import { BaseBlock } from './base-block';

const GlassFrame: BlockType = {
  name: 'glass-frame',
  ...BaseBlock,
  isTransparent: true,
  textures: {
    all: 'glass_frame.png',
  },
};

module.exports = GlassFrame;
