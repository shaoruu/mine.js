import { BlockType } from '../libs';

export const makeColorBlock = (data: Partial<BlockType>) => {
  const { id, name } = data;

  if (!id || !name) throw new Error('Color block needs an ID and a name');

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
    ...data,
  } as BlockType;
};
