import { Coords3 } from '../libs';
import { Helper } from '../utils';

import ndarray from 'ndarray';
import { Engine } from '..';

type ChunkOptions = {
  size: number;
};

class Chunk {
  public coords: Coords3;
  public voxels: ndarray;
  public engine: Engine;

  public size: number;

  public isDirty: true;

  constructor(engine: Engine, { size }: ChunkOptions) {
    this.engine = engine;

    this.size = size;

    this.voxels = ndarray(new Int8Array(size * size * size), [size, size, size]);
  }

  get name() {
    return Helper.getChunkName(this.coords);
  }
}

export { Chunk };
