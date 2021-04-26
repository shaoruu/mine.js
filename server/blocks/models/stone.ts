import { BlockType } from '../../libs';

const Stone: BlockType = {
  name: 'stone',
  isEmpty: false,
  isSolid: true,
  isFluid: false,
  isTransparent: false,
  isLight: false,
  textures: {
    all: 'stone.png',
  },
};

module.exports = Stone;
