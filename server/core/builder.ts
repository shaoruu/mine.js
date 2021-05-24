import { Plants, Trees } from '../libs';
import { VoxelUpdate } from '../libs/types';

import { Chunk, World } from '.';

class Builder {
  public static trees = new Trees();
  public static plants = new Plants();

  constructor(public world: World) {}

  build = (chunk: Chunk) => {
    const updates: VoxelUpdate[] = [];

    // 1. tree
    updates.push(...Builder.plants.generate(chunk));
    updates.push(...Builder.trees.generate(chunk));

    this.world.updateMany(updates, true);
  };
}

export { Builder };
