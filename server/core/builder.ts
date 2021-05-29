import { Lamps, Plants, Trees } from '../libs';
import { VoxelUpdate } from '../libs/types';

import { Chunk, World } from '.';

class Builder {
  public static trees = new Trees();
  public static plants = new Plants();
  public static lamps = new Lamps();

  constructor(public world: World) {}

  build = (chunk: Chunk) => {
    const updates: VoxelUpdate[] = [];

    // 1. plants
    updates.push(...Builder.plants.generate(chunk));

    // 2. trees
    updates.push(...Builder.trees.generate(chunk));

    // 3. lamps
    updates.push(...Builder.lamps.generate(chunk));

    updates.forEach(({ voxel, type }) => {
      this.world.chunks.setVoxel(voxel, type);
    });
  };
}

export { Builder };
