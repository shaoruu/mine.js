import { BlockType } from '../../libs';

const Glass: BlockType = {
  name: 'glass',
  isEmpty: false,
  isSolid: true,
  isFluid: false,
  isTransparent: true,
  isLight: false,
  textures: {
    all: 'glass.png',
  },
};

module.exports = Glass;
