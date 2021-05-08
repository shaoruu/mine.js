import { BaseBlock } from '../blocks';
import { BlockType } from '../libs';

export const makeColorBlock = (data: Partial<BlockType>): BlockType => {
  const { name } = data;

  if (!name) throw new Error('Color block needs a name');

  return {
    name,
    ...BaseBlock,
    textures: {
      all: `${name.toLowerCase()}.ts`,
    },
    ...data,
  } as BlockType;
};
