import { BlockType } from '../../libs';

const Dirt: BlockType = {
  name: 'dirt',
  isEmpty: false,
  isSolid: true,
  isFluid: false,
  isTransparent: false,
  textures: {
    all: 'dirt.png',
  },
};

module.exports = Dirt;
