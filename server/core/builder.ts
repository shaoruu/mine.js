import { Tree } from '../libs';

import { Chunk, World } from '.';

class Builder {
  private tree: Tree;

  constructor(public world: World) {
    this.tree = new Tree(world);
  }

  build = (chunk: Chunk) => {
    // 1. tree
    this.tree.build(chunk);
  };
}

export { Builder };
