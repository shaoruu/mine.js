import { BlockType } from '../../libs';

const Snow: BlockType = {
  id: 12,
  name: 'snow',
  isEmpty: false,
  isSolid: true,
  isFluid: false,
  isTransparent: false,
  isLight: false,
  textures: {
    all: 'snow.ts',
  },
};

module.exports = Snow;
