import { Coords3, Helper, MeshType } from '../../shared';

import { AO_TABLE, FACES } from './constants';

import { Chunk, Registry, Mine } from '.';

class Mesher {
  static meshChunk = (chunk: Chunk, transparent = false): MeshType | null => {
    const {
      min,
      max,
      topY,
      world,
      options: { dimension },
    } = chunk;

    const {
      options: { useSmoothLighting },
    } = world;

    const { registry } = Mine;

    const positions = [];
    const normals = [];
    const indices = [];
    const uvs = [];
    const aos = [];

    let sunlightLevels: number[] = [];
    let torchLightLevels: number[] = [];

    const smoothSunlightLevels: string[] = [];
    const smoothTorchlightLevels: string[] = [];

    const [startX, startY, startZ] = min;
    const [endX, endY, endZ] = max;

    const vertexToLight: Map<string, { count: number; torchLight: number; sunlight: number }> = new Map();

    function vertexAO(side1: number, side2: number, corner: number) {
      const numS1 = Number(!registry.getTransparencyByID(side1));
      const numS2 = Number(!registry.getTransparencyByID(side2));
      const numC = Number(!registry.getTransparencyByID(corner));

      if (numS1 && numS2) {
        return 0;
      }
      return 3 - (numS1 + numS2 + numC);
    }

    for (let vx = startX; vx < endX; vx++) {
      for (let vy = startY; vy < topY + 1; vy++) {
        for (let vz = startZ; vz < endZ; vz++) {
          const voxel = world.getVoxelByVoxel([vx, vy, vz]);
          const vBlockType = world.getBlockTypeByType(voxel);
          const { isSolid, isTransparent } = vBlockType;

          if (isSolid && (transparent ? isTransparent : !isTransparent)) {
            for (const { dir, corners } of FACES) {
              const nvx = vx + dir[0];
              const nvy = vy + dir[1];
              const nvz = vz + dir[2];

              const neighbor = world.getVoxelByVoxel([nvx, nvy, nvz]);
              const nBlockType = world.getBlockTypeByType(neighbor);
              const { isEmpty: isNeighborEmpty, isTransparent: isNeighborTransparent } = nBlockType;

              if (isNeighborTransparent && (!transparent || isNeighborEmpty)) {
                const torchLightLevel = world.getTorchLight([nvx, nvy, nvz]);
                const sunlightLevel = world.getSunlight([nvx, nvy, nvz]);

                for (const { pos } of corners) {
                  const posX = pos[0] + vx;
                  const posY = pos[1] + vy;
                  const posZ = pos[2] + vz;

                  if (useSmoothLighting) {
                    const rep = Helper.getVoxelName([posX * dimension, posY * dimension, posZ * dimension]);

                    if (vertexToLight.has(rep)) {
                      const { count, torchLight, sunlight } = vertexToLight.get(rep);
                      vertexToLight.set(rep, {
                        count: count + 1,
                        torchLight: torchLight + torchLightLevel,
                        sunlight: sunlight + sunlightLevel,
                      });
                    } else {
                      vertexToLight.set(rep, {
                        count: 1,
                        torchLight: torchLightLevel,
                        sunlight: sunlightLevel,
                      });
                    }

                    const test: [boolean, Coords3][] = [
                      [posX === startX, [-1, 0, 0]],
                      [posY === startY, [0, -1, 0]],
                      [posZ === startZ, [0, 0, -1]],
                      // position can be voxel + 1, thus can reach end
                      [posX === endX, [1, 0, 0]],
                      [posY === endY, [0, 1, 0]],
                      [posZ === endZ, [0, 0, 1]],
                      // edges
                      [posX === startX && posY === startY, [-1, -1, 0]],
                      [posX === startX && posZ === startZ, [-1, 0, -1]],
                      [posX === startX && posY === endY, [-1, 1, 0]],
                      [posX === startX && posZ === endZ, [-1, 0, 1]],
                      [posX === endX && posY === startY, [1, -1, 0]],
                      [posX === endX && posZ === startZ, [1, 0, -1]],
                      [posX === endX && posY === endY, [1, 1, 0]],
                      [posX === endX && posZ === endZ, [1, 0, 1]],
                      [posY === startY && posZ === startZ, [0, -1, -1]],
                      [posY === endY && posZ === startZ, [0, 1, -1]],
                      [posY === startY && posZ === endZ, [0, -1, 1]],
                      [posY === endY && posZ === endZ, [0, 1, 1]],
                      // corners
                      [posX === startX && posY === startY && posZ === startZ, [-1, -1, -1]],
                      [posX === startX && posY === startY && posZ === endZ, [-1, -1, 1]],
                      [posX === startX && posY === endY && posZ === startZ, [-1, 1, -1]],
                      [posX === startX && posY === endY && posZ === endZ, [-1, 1, 1]],
                      [posX === endX && posY === startY && posZ === startZ, [1, -1, -1]],
                      [posX === endX && posY === startY && posZ === endZ, [1, -1, 1]],
                      [posX === endX && posY === endY && posZ === startZ, [1, 1, -1]],
                      [posX === endX && posY === endY && posZ === endZ, [1, 1, 1]],
                    ];

                    test.forEach(([check, [a, b, c]]) => {
                      if (check && world.getTransparencyByVoxel([nvx + a, nvy + b, nvz + c])) {
                        const torchLightLevelN = world.getTorchLight([nvx + a, nvy + b, nvz + c]);
                        const sunlightLevelN = world.getSunlight([nvx + a, nvy + b, nvz + c]);
                        const { count, torchLight, sunlight } = vertexToLight.get(rep);
                        vertexToLight.set(rep, {
                          count: count + 1,
                          torchLight: torchLight + torchLightLevelN,
                          sunlight: sunlight + sunlightLevelN,
                        });
                      }
                    });

                    smoothSunlightLevels.push(rep);
                    smoothTorchlightLevels.push(rep);
                  }
                }

                if (!useSmoothLighting) {
                  torchLightLevels.push(torchLightLevel, torchLightLevel, torchLightLevel, torchLightLevel);
                  sunlightLevels.push(sunlightLevel, sunlightLevel, sunlightLevel, sunlightLevel);
                }
              }
            }
          }
        }
      }
    }

    if (useSmoothLighting) {
      sunlightLevels = smoothSunlightLevels.map((rep) => {
        const { sunlight, count } = vertexToLight.get(rep);
        return sunlight / count;
      });
      torchLightLevels = smoothTorchlightLevels.map((rep) => {
        const { torchLight, count } = vertexToLight.get(rep);
        return torchLight / count;
      });
    }

    let i = 0;
    for (let vx = startX; vx < endX; vx++) {
      for (let vy = startY; vy < topY + 1; vy++) {
        for (let vz = startZ; vz < endZ; vz++) {
          const voxel = world.getVoxelByVoxel([vx, vy, vz]);
          const isSolid = registry.getSolidityByID(voxel);
          const isTransparent = registry.getTransparencyByID(voxel);

          if (isSolid && (transparent ? isTransparent : !isTransparent)) {
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
              const isNeighborEmpty = registry.getEmptinessByID(neighbor);
              const isNeighborTransparent = registry.getTransparencyByID(neighbor);

              if (isNeighborTransparent && (!transparent || isNeighborEmpty)) {
                const nearVoxels = neighbors.map(([a, b, c]) => world.getVoxelByVoxel([vx + a, vy + b, vz + c]));

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

                  normals.push(...dir);
                  positions.push(posX * dimension, posY * dimension, posZ * dimension);
                  uvs.push(uv[0] * (endU - startU) + startU, uv[1] * (startV - endV) + endV);
                  faceAOs.push(AO_TABLE[vertexAO(nearVoxels[side1], nearVoxels[side2], nearVoxels[corner])] / 255);
                }

                const aT = torchLightLevels[i + 0];
                const bT = torchLightLevels[i + 1];
                const cT = torchLightLevels[i + 2];
                const dT = torchLightLevels[i + 3];

                const threshold = 0;

                // at least one is zero
                const oneT0 = aT <= threshold || bT <= threshold || cT <= threshold || dT <= threshold;
                // one is zero, and ao rule
                const ozao = aT + dT < bT + cT;
                // all not zero, 4 parts

                //  b        d
                //     -
                //        -
                //  a        c

                const anzp1 = (bT > (aT + dT) / 2 && (aT + dT) / 2 > cT) || (cT > (aT + dT) / 2 && (aT + dT) / 2 > bT); // fixed two light sources colliding
                const anz = oneT0 && anzp1;

                if (faceAOs[0] + faceAOs[3] > faceAOs[1] + faceAOs[2] || (useSmoothLighting && (ozao || anz))) {
                  // generate flipped quad
                  indices.push(ndx, ndx + 1, ndx + 3, ndx + 3, ndx + 2, ndx);
                } else {
                  // generate normal quad
                  indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
                }

                i += 4;

                aos.push(...faceAOs);
              }
            }
          }
        }
      }
    }

    if (transparent && indices.length === 0) return null;

    return {
      aos: new Float32Array(aos),
      indices: new Float32Array(indices),
      normals: new Float32Array(normals),
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      sunlights: new Float32Array(sunlightLevels),
      torchLights: new Float32Array(torchLightLevels),
    };
  };
}

export { Mesher };
