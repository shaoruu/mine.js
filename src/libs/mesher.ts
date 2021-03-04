import { Chunk } from '../app';

type MeshResultType = {
  positions: number[];
  normals: number[];
  indices: number[];
};

class Mesher {
  static async simpleCull(chunk: Chunk): Promise<MeshResultType> {
    const { dimension, minInner, maxInner } = chunk;

    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    const [startX, startY, startZ] = minInner;
    const [endX, endY, endZ] = maxInner;

    for (let vx = startX; vx < endX; ++vx) {
      for (let vy = startY; vy < endY; ++vy) {
        for (let vz = startZ; vz < endZ; ++vz) {
          const voxel = chunk.getVoxel(vx, vy, vz);

          if (voxel) {
            // There is a voxel here but do we need faces for it?
            for (const { dir, corners } of Mesher.faces) {
              const neighbor = chunk.getVoxel(vx + dir[0], vy + dir[1], vz + dir[2]);
              if (!neighbor) {
                // this voxel has no neighbor in this direction so we need a face.
                const ndx = positions.length / 3;
                for (const pos of corners) {
                  positions.push((pos[0] + vx) * dimension, (pos[1] + vy) * dimension, (pos[2] + vz) * dimension);
                  normals.push(...dir);
                }
                indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
              }
            }
          }
        }
      }
    }

    return {
      positions,
      normals,
      indices,
    };
  }

  static faces = [
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

export { Mesher };
