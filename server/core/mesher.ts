import { AO_TABLE, FACES } from './constants';

import { Chunk, Registry } from '.';

function vertexAO(side1: number, side2: number, corner: number) {
  const numS1 = Number(side1 !== 0);
  const numS2 = Number(side2 !== 0);
  const numC = Number(corner !== 0);

  if (numS1 && numS2) {
    return 0;
  }
  return 3 - (numS1 + numS2 + numC);
}

class Mesher {
  static meshChunk = (chunk: Chunk) => {
    const {
      min,
      max,
      voxels,
      world,
      options: { dimension },
    } = chunk;
    const { registry } = world;

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
          const isSolid = registry.getSolidityByID(voxel);

          if (isSolid) {
            const texture = registry.getTextureByID(voxel);
            const textureType = Registry.getTextureType(texture);
            const uvMap = registry.getUVByID(voxel);

            const isMat1 = textureType === 'mat1';
            const isMat3 = textureType === 'mat3';

            for (const { dir, mat3, mat6, corners, neighbors } of FACES) {
              const nvx = vx + dir[0];
              const nvy = vy + dir[1];
              const nvz = vz + dir[2];

              const neighbor = world.getVoxelByVoxel([nvx, nvy, nvz]);
              const isNeighborSolid = registry.getSolidityByID(neighbor);

              if (!isNeighborSolid) {
                const nearVoxels = neighbors.map(([a, b, c]) => world.getVoxelByVoxel([nvx + a, nvy + b, nvz + c]));

                const { startU, endU, startV, endV } = isMat1
                  ? uvMap[texture.all]
                  : isMat3
                  ? uvMap[texture[mat3]]
                  : uvMap[texture[mat6]];

                const ndx = positions.length / 3;
                const faceAOs = [];

                for (const { pos, uv, side1, side2, corner } of corners) {
                  const posX = pos[0] + vx;
                  const posY = pos[1] + vy;
                  const posZ = pos[2] + vz;

                  positions.push(posX * dimension, posY * dimension, posZ * dimension);
                  faceAOs.push(AO_TABLE[vertexAO(nearVoxels[side1], nearVoxels[side2], nearVoxels[corner])] / 255);
                  normals.push(...dir);
                  uvs.push(uv[0] * (endU - startU) + startU, uv[1] * (startV - endV) + endV);
                }

                if (faceAOs[0] + faceAOs[3] > faceAOs[1] + faceAOs[2]) {
                  // generate flipped quad
                  indices.push(ndx, ndx + 1, ndx + 3, ndx + 3, ndx + 2, ndx + 0);
                } else {
                  // generate normal quad
                  indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
                }

                aos.push(...faceAOs);
              }
            }
          }
        }
      }
    }

    return {
      aos: new Float32Array(aos),
      indices: new Float32Array(indices),
      normals: new Float32Array(normals),
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
    };
  };
}

export { Mesher };
