import { BlockType } from '../libs';

export const makeColorBlock = (data: Partial<BlockType>) => {
  const { name } = data;

  if (!name) throw new Error('Color block needs a name');

  return {
    name,
    isEmpty: false,
    isSolid: true,
    isFluid: false,
    isTransparent: false,
    isLight: false,
    textures: {
      all: `${name.toLowerCase()}.ts`,
    },
    ...data,
  } as BlockType;
};
