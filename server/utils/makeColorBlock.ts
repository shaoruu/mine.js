import { BlockType } from '../libs';

export const makeColorBlock = ({ id, name }: { id: number; name: string }) => {
  return {
    id,
    name,
    isEmpty: false,
    isSolid: true,
    isFluid: false,
    isTransparent: false,
    isLight: false,
    textures: {
      all: `${name}.ts`,
    },
  } as BlockType;
};
