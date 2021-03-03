import ndarray from 'ndarray';

import { Engine } from '../..';
import { Chunk } from '../../app';

abstract class Generator {
  constructor(public engine: Engine) {}

  // base: [0, 0, 0] of chunk data
  abstract generate(chunk: Chunk): void;
  abstract getVoxelAt(vx: number, vy: number, vz: number): number;

  getChunkSize(data: ndarray) {
    const { shape } = data;
    return shape[0];
  }
}

export { Generator };
