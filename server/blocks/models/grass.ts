import { BlockType } from '../../libs';

const Grass: BlockType = {
  id: 2,
  name: 'grass',
  isEmpty: false,
  isSolid: true,
  isFluid: false,
  isTransparent: false,
  isLight: false,
  textures: {
    top: 'grass_top.png',
    side: 'grass_side.png',
    bottom: 'dirt.png',
  },
};

module.exports = Grass;
