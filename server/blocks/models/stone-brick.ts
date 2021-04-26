import { BlockType } from '../../libs';

const StoneBrick: BlockType = {
  name: 'stone brick',
  isEmpty: false,
  isSolid: true,
  isFluid: false,
  isTransparent: false,
  isLight: false,
  textures: {
    all: 'brick_grey.png',
  },
};

module.exports = StoneBrick;
