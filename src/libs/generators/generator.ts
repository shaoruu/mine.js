import ndarray from 'ndarray';
import { Engine } from '../..';
import { Coords3 } from '../types';

abstract class Generator {
  constructor(public engine: Engine) {}

  // base: [0, 0, 0] of chunk data
  abstract generate(data: ndarray, base: Coords3): void;
  abstract getVoxelAt(voxel: Coords3): number;

  getChunkSize(data: ndarray) {
    const { shape } = data;
    return shape[0];
  }

  protected faces = [
    {
      // left
      dir: [-1, 0, 0],
      corners: [
        [0, 1, 0],
        [0, 0, 0],
        [0, 1, 1],
        [0, 0, 1],
      ],
    },
    {
      // right
      dir: [1, 0, 0],
      corners: [
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 0],
        [1, 0, 0],
      ],
    },
    {
      // bottom
      dir: [0, -1, 0],
      corners: [
        [1, 0, 1],
        [0, 0, 1],
        [1, 0, 0],
        [0, 0, 0],
      ],
    },
    {
      // top
      dir: [0, 1, 0],
      corners: [
        [0, 1, 1],
        [1, 1, 1],
        [0, 1, 0],
        [1, 1, 0],
      ],
    },
    {
      // back
      dir: [0, 0, -1],
      corners: [
        [1, 0, 0],
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    },
    {
      // front
      dir: [0, 0, 1],
      corners: [
        [0, 0, 1],
        [1, 0, 1],
        [0, 1, 1],
        [1, 1, 1],
      ],
    },
  ];
}

export { Generator };
