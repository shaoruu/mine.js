import { Coords3, Helper, MeshType } from '../../shared';
import { Noise } from '../libs';

import { AO_TABLE, BLOCK_FACES, PLANT_FACES } from './constants';

import { Chunk, Registry, Mine } from '.';

const MAX_PLANT_OFFSET = 0.5;
const PLANT_SHRINK = 0.6;

class Mesher {
  private static getPlantOffsets = (vx: number, vz: number) => {
    return [
      Helper.clamp(
        Helper.round(Noise.fractalOctavePerlin3(vx * 0.8, 1, vz * 0.5, 1), 3),
        -MAX_PLANT_OFFSET,
        MAX_PLANT_OFFSET,
      ),
      Helper.clamp(
        Helper.round(Noise.fractalOctavePerlin3(vx * 0.2, 1, vz * 0.9, 1), 3),
        -MAX_PLANT_OFFSET,
        MAX_PLANT_OFFSET,
      ),
    ];
  };

  static meshChunk = (chunk: Chunk, transparent = false): MeshType | null => {
    const {
      min,
      max,
      topY,
      world,
      options: { dimension },
    } = chunk;

    const { registry } = Mine;

    const positions = [];
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
          const { isSolid, isTransparent, isBlock, isPlant } = vBlockType;

          if ((isSolid || isPlant) && (transparent ? isTransparent : !isTransparent)) {
            if (isPlant) {
              const [dx, dz] = Mesher.getPlantOffsets(vx, vz);

              const torchLightLevel = world.getTorchLight([vx, vy, vz]);
              const sunlightLevel = world.getSunlight([vx, vy, vz]);

              for (const { corners } of PLANT_FACES) {
                for (const { pos } of corners) {
                  const offset = (1 - PLANT_SHRINK) / 2;
                  const posX = pos[0] * PLANT_SHRINK + offset + vx + dx;
                  const posY = pos[1] + vy;
                  const posZ = pos[2] * PLANT_SHRINK + offset + vz + dz;

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

                  smoothSunlightLevels.push(rep);
                  smoothTorchlightLevels.push(rep);
                }
              }
            } else if (isBlock) {
              for (const { dir, corners } of BLOCK_FACES) {
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
              }
            }
          }
        }
      }
    }

    sunlightLevels = smoothSunlightLevels.map((rep) => {
      const { sunlight, count } = vertexToLight.get(rep);
      return sunlight / count;
    });
    torchLightLevels = smoothTorchlightLevels.map((rep) => {
      const { torchLight, count } = vertexToLight.get(rep);
      return torchLight / count;
    });

    let i = 0;
    for (let vx = startX; vx < endX; vx++) {
      for (let vy = startY; vy < topY + 1; vy++) {
        for (let vz = startZ; vz < endZ; vz++) {
          const voxel = world.getVoxelByVoxel([vx, vy, vz]);
          const vBlockType = world.getBlockTypeByType(voxel);
          const { isSolid, isTransparent, isBlock, isPlant } = vBlockType;

          if ((isSolid || isPlant) && (transparent ? isTransparent : !isTransparent)) {
            const texture = registry.getTextureByID(voxel);
            const textureType = Registry.getTextureType(texture);
            const uvMap = registry.getUVByID(voxel);

            if (isPlant) {
              const [dx, dz] = Mesher.getPlantOffsets(vx, vz);

              for (const { corners, mat } of PLANT_FACES) {
                const { startU, endU, startV, endV } = uvMap[texture[mat]];
                const ndx = positions.length / 3;

                for (const { pos, uv } of corners) {
                  const offset = (1 - PLANT_SHRINK) / 2;
                  const posX = pos[0] * PLANT_SHRINK + offset + vx + dx;
                  const posY = pos[1] + vy;
                  const posZ = pos[2] * PLANT_SHRINK + offset + vz + dz;

                  positions.push(posX * dimension, posY * dimension, posZ * dimension);
                  uvs.push(uv[0] * (endU - startU) + startU, uv[1] * (startV - endV) + endV);
                  aos.push(1);
                }

                indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);

                i += 4;
              }
            } else if (isBlock) {
              const isMat1 = textureType === 'mat1';
              const isMat3 = textureType === 'mat3';

              for (const { dir, mat3, mat6, corners, neighbors } of BLOCK_FACES) {
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

                    positions.push(posX * dimension, posY * dimension, posZ * dimension);
                    uvs.push(uv[0] * (endU - startU) + startU, uv[1] * (startV - endV) + endV);
                    faceAOs.push(AO_TABLE[vertexAO(nearVoxels[side1], nearVoxels[side2], nearVoxels[corner])] / 255);
                  }

                  const aT = torchLightLevels[i + 0];
                  const bT = torchLightLevels[i + 1];
                  const cT = torchLightLevels[i + 2];
                  const dT = torchLightLevels[i + 3];

                  const threshold = 0;

                  /* -------------------------------------------------------------------------- */
                  /*                     I KNOW THIS IS UGLY, BUT IT WORKS!                     */
                  /* -------------------------------------------------------------------------- */
                  // at least one is zero
                  const oneT0 = aT <= threshold || bT <= threshold || cT <= threshold || dT <= threshold;
                  // one is zero, and ao rule, but only for zero AO's
                  const ozao = aT + dT < bT + cT && faceAOs[0] + faceAOs[3] === faceAOs[1] + faceAOs[2];
                  // all not zero, 4 parts
                  const anzp1 =
                    (bT > (aT + dT) / 2 && (aT + dT) / 2 > cT) || (cT > (aT + dT) / 2 && (aT + dT) / 2 > bT); // fixed two light sources colliding
                  const anz = oneT0 && anzp1; // at least one is zero, and light source colliding fix

                  if (faceAOs[0] + faceAOs[3] > faceAOs[1] + faceAOs[2] || ozao || anz) {
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
    }

    if (transparent && indices.length === 0) return null;

    return {
      aos: new Float32Array(aos),
      indices: new Float32Array(indices),
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      sunlights: new Float32Array(sunlightLevels),
      torchLights: new Float32Array(torchLightLevels),
    };
  };
}

export { Mesher };
