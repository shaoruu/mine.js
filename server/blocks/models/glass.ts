import { BlockType } from '../../libs';

const Glass: BlockType = {
  id: 4,
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
