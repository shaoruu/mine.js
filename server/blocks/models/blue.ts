import { BlockType } from '../../libs';

const Blue: BlockType = {
  id: 10,
  name: 'blue',
  isEmpty: false,
  isSolid: true,
  isFluid: false,
  isTransparent: false,
  isLight: false,
  textures: {
    all: 'blue.ts',
  },
};

module.exports = Blue;
