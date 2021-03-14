import ndarray from 'ndarray';

import { Engine } from '../..';
import { Chunk } from '../../app';

abstract class Generator {
  protected blockTypes: Map<string, number> = new Map();

  constructor(public engine: Engine) {}

  // base: [0, 0, 0] of chunk data
  abstract generate(chunk: Chunk): Promise<void>;

  useBlockID(name: string) {
    const blockIndex = this.engine.registry.getBlockIndex(name);
    this.blockTypes.set(name, blockIndex);
    return blockIndex;
  }

  getBlockID(name: string) {
    const blockID = this.blockTypes.get(name);
    if (blockID === undefined) throw new Error(`Generator cannot find block of type: ${name}`);
    return blockID;
  }

  getChunkSize(data: ndarray) {
    const { shape } = data;
    return shape[0];
  }
}

export { Generator };
