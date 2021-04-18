import { AO_TABLE, FACES } from './constants';

import { Chunk } from '.';

class Mesher {
  static meshChunk = (chunk: Chunk) => {
    const {
      min,
      max,
      voxels,
      options: { size, dimension },
    } = chunk;

    const positions = [];
    const normals = [];
    const indices = [];
    const uvs = [];
    const aos = [];

    const [startX, startY, startZ] = min;
    const [endX, endY, endZ] = max;

    for (let vx = startX, lx = 0; vx < endX; vx++, lx++) {
      for (let vy = startY, ly = 0; vy < endY; vy++, ly++) {
        for (let vz = startZ, lz = 0; vz < endZ; vz++, lz++) {
          const voxel = voxels.get(lx, ly, lz);

          if (voxel) {
          }
        }
      }
    }
  };
}

export { Mesher };
