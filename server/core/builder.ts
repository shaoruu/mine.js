import { Tree } from '../libs';
import { VoxelUpdate } from '../libs/types';

import { Chunk, World } from '.';

class Builder {
  public static tree = new Tree();

  constructor(public world: World) {}

  build = (chunk: Chunk) => {
    const updates: VoxelUpdate[] = [];

    // 1. tree
    updates.push(...Builder.tree.generate(chunk));

    this.world.updateMany(updates, true);
  };
}

export { Builder };
