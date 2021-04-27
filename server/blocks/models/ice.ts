import { BlockType } from '../../libs';

const Ice: BlockType = {
  name: 'ice',
  isEmpty: false,
  isSolid: true,
  isFluid: false,
  isTransparent: false,
  isLight: false,
  textures: {
    all: 'ice.png',
  },
};

module.exports = Ice;
