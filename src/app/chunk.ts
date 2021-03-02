import { Coords3 } from '../libs';
import { Helper } from '../utils';

import ndarray from 'ndarray';

type ChunkOptions = {
  size: number;
};

class Chunk {
  public coords: Coords3;
  public data: ndarray;

  public size: number;

  public isDirty: false;

  constructor(options: ChunkOptions) {
    this.size = options.size;
  }

  get name() {
    return Helper.getChunkName(this.coords);
  }
}

export { Chunk };
