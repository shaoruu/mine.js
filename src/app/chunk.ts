import vec3 from 'gl-vec3';
import ndarray from 'ndarray';

import { Engine } from '..';
import { Coords3 } from '../libs';
import { Helper } from '../utils';

type ChunkOptions = {
  size: number;
};

class Chunk {
  public coords: Coords3;
  public voxels: ndarray;
  public engine: Engine;

  public size: number;

  public isDirty = true;
  public isInitialized = false;

  constructor(engine: Engine, coords: Coords3, { size }: ChunkOptions) {
    this.engine = engine;
    this.coords = coords;
    this.size = size;

    this.voxels = ndarray(new Int8Array(size * size * size), [size, size, size]);
  }

  mesh() {
    console.log('meshing: ', this.name);
    this.isDirty = false;
  }

  get base() {
    const results = vec3.create() as Coords3;
    vec3.scale(results, this.coords, this.size);
    return results;
  }

  get name() {
    return Helper.getChunkName(this.coords);
  }
}

export { Chunk };
