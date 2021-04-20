import { BlockType } from '../../libs';

const Grass: BlockType = {
  name: 'grass',
  isEmpty: false,
  isSolid: true,
  isFluid: false,
  isTransparent: false,
  textures: {
    top: 'grass_top.png',
    side: 'grass_side.png',
    bottom: 'dirt.png',
  },
};

module.exports = Grass;
