import { Coords3 } from '../../../shared';
import { Chunk } from '../../core';

abstract class Base {
  // range: 2x2 area indicating how big the player is
  constructor(public range: [number, number]) {}

  // calculate all locations to build
  abstract sample(chunk: Chunk): Coords3[];

  // build on all sampled locations within chunk
  abstract build(chunk: Chunk): void;
}

export { Base };
