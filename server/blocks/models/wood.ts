import { BlockType } from '../../libs';

const Wood: BlockType = {
  name: 'wood',
  isEmpty: false,
  isSolid: true,
  isFluid: false,
  isTransparent: false,
  isLight: false,
  textures: {
    all: 'wood.png',
  },
};

module.exports = Wood;
