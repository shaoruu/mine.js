import { BlockType } from '../../libs';

const Stone: BlockType = {
  id: 3,
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
