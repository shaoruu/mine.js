import { BlockType } from '../../libs';

const Green: BlockType = {
  id: 11,
  name: 'green',
  isEmpty: false,
  isSolid: true,
  isFluid: false,
  isTransparent: false,
  isLight: false,
  textures: {
    all: 'blue.ts',
  },
};

module.exports = Green;
