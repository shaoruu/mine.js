import { BlockType } from '../../libs';

const Dirt: BlockType = {
  id: 1,
  name: 'dirt',
  isEmpty: false,
  isSolid: true,
  isFluid: false,
  isTransparent: false,
  isLight: false,
  textures: {
    all: 'dirt.png',
  },
};

module.exports = Dirt;
