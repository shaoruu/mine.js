// AO from https://github.com/joshmarinacci/voxeljs-next/blob/05514704fe109c69072ae819f1032603bdb633d3/src/VoxelMesh.js#L363

const AO_TABLE = new Uint8Array([75, 153, 204, 255]);

const FACES = [
  {
    // viewing from -x to +x (head towards +y) (indices):
    // 0 1 2
    // 3 i 4 (i for irrelevant)
    // 5 6 7

    // corners:
    // 0,1,1  0,1,0
    // 0,0,1  0,0,0

    // left
    dir: [-1, 0, 0],
    mat3: 1, // side
    mat6: 3, // nx
    corners: [
      { pos: [0, 1, 0], uv: [0, 1], side1: 1, side2: 3, corner: 0 },
      { pos: [0, 0, 0], uv: [0, 0], side1: 3, side2: 6, corner: 5 },
      { pos: [0, 1, 1], uv: [1, 1], side1: 1, side2: 4, corner: 2 },
      { pos: [0, 0, 1], uv: [1, 0], side1: 4, side2: 6, corner: 7 },
    ],
    neighbors: [
      [-1, 1, -1], // 0
      [-1, 1, 0],
      [-1, 1, 1],
      [-1, 0, -1], // 3
      [-1, 0, 1], // 4
      [-1, -1, -1],
      [-1, -1, 0],
      [-1, -1, 1],
    ],
  },
  {
    // viewing from +x to -x (head towards +y) (indices):
    // 2 1 0
    // 4 i 3 (i for irrelevant)
    // 7 6 5

    // corners:
    // 1,1,1  1,1,0
    // 1,0,1  1,0,0

    // right
    dir: [1, 0, 0],
    mat3: 1, // side
    mat6: 0, // px
    corners: [
      { pos: [1, 1, 1], uv: [0, 1], side1: 1, side2: 4, corner: 2 },
      { pos: [1, 0, 1], uv: [0, 0], side1: 4, side2: 6, corner: 7 },
      { pos: [1, 1, 0], uv: [1, 1], side1: 1, side2: 3, corner: 0 },
      { pos: [1, 0, 0], uv: [1, 0], side1: 3, side2: 6, corner: 5 },
    ],
    neighbors: [
      [1, 1, -1], // 0
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, -1], // 3
      [1, 0, 1], // 4
      [1, -1, -1],
      [1, -1, 0],
      [1, -1, 1],
    ],
  },
  {
    // viewing from -y to +y (head towards +z) (indices):
    // 0 1 2
    // 3 i 4 (i for irrelevant)
    // 5 6 7

    // corners:
    // 0,0,1  1,0,1
    // 0,0,0  1,0,0

    // bottom
    dir: [0, -1, 0],
    mat3: 2, // bottom
    mat6: 4, // ny
    corners: [
      { pos: [1, 0, 1], uv: [1, 0], side1: 1, side2: 4, corner: 2 },
      { pos: [0, 0, 1], uv: [0, 0], side1: 1, side2: 3, corner: 0 },
      { pos: [1, 0, 0], uv: [1, 1], side1: 4, side2: 6, corner: 7 },
      { pos: [0, 0, 0], uv: [0, 1], side1: 3, side2: 6, corner: 5 },
    ],
    neighbors: [
      [-1, -1, 1],
      [0, -1, 1],
      [1, -1, 1],
      [-1, -1, 0],
      [1, -1, 0],
      [-1, -1, -1],
      [0, -1, -1],
      [1, -1, -1],
    ],
  },
  {
    // viewing from +y to -y (head towards +z) (indices):
    // 2 1 0
    // 4 i 3 (i for irrelevant)
    // 7 6 5

    // corners:
    // 1,1,1  0,1,1
    // 1,1,0  0,1,0

    // top
    dir: [0, 1, 0],
    mat3: 0, // top
    mat6: 1, // py
    corners: [
      { pos: [0, 1, 1], uv: [1, 1], side1: 1, side2: 3, corner: 0 },
      { pos: [1, 1, 1], uv: [0, 1], side1: 1, side2: 4, corner: 2 },
      { pos: [0, 1, 0], uv: [1, 0], side1: 3, side2: 6, corner: 5 },
      { pos: [1, 1, 0], uv: [0, 0], side1: 4, side2: 6, corner: 7 },
    ],
    neighbors: [
      [-1, 1, 1],
      [0, 1, 1],
      [1, 1, 1],
      [-1, 1, 0],
      [1, 1, 0],
      [-1, 1, -1],
      [0, 1, -1],
      [1, 1, -1],
    ],
  },
  {
    // viewing from -z to +z (head towards +y) (indices):
    // 0 1 2
    // 3 i 4 (i for irrelevant)
    // 5 6 7

    // corners:
    // 1,1,0  0,1,0
    // 1,0,0  0,0,0

    // back
    dir: [0, 0, -1],
    mat3: 1, // side
    mat6: 5, // nz
    corners: [
      { pos: [1, 0, 0], uv: [0, 0], side1: 3, side2: 6, corner: 5 },
      { pos: [0, 0, 0], uv: [1, 0], side1: 4, side2: 6, corner: 7 },
      { pos: [1, 1, 0], uv: [0, 1], side1: 1, side2: 3, corner: 0 },
      { pos: [0, 1, 0], uv: [1, 1], side1: 1, side2: 4, corner: 2 },
    ],
    neighbors: [
      [1, 1, -1],
      [0, 1, -1],
      [-1, 1, -1],
      [1, 0, -1],
      [-1, 0, -1],
      [1, -1, -1],
      [0, -1, -1],
      [-1, -1, -1],
    ],
  },
  {
    // viewing from +z to -z (head towards +y) (indices):
    // 2 1 0
    // 4 i 3 (i for irrelevant)
    // 7 6 5

    // corners:
    // 0,1,1  1,1,1
    // 0,0,1  1,0,1

    // front
    dir: [0, 0, 1],
    mat3: 1, // side
    mat6: 2, // pz
    corners: [
      { pos: [0, 0, 1], uv: [0, 0], side1: 4, side2: 6, corner: 7 },
      { pos: [1, 0, 1], uv: [1, 0], side1: 3, side2: 6, corner: 5 },
      { pos: [0, 1, 1], uv: [0, 1], side1: 1, side2: 4, corner: 2 },
      { pos: [1, 1, 1], uv: [1, 1], side1: 1, side2: 3, corner: 0 },
    ],
    neighbors: [
      [1, 1, 1],
      [0, 1, 1],
      [-1, 1, 1],
      [1, 0, 1],
      [-1, 0, 1],
      [1, -1, 1],
      [0, -1, 1],
      [-1, -1, 1],
    ],
  },
];

function toRep(x, y, z) {
  return `${x}|` + `${y}` + `|${z}`;
}

function get(arr, x, y, z, stride) {
  return arr[x * stride[0] + y * stride[1] + z * stride[2]];
}

function getTorchLight(arr, x, y, z, stride) {
  return get(arr, x, y, z, stride) & 0xf;
}

function vertexAO(side1, side2, corner) {
  const numS1 = Number(side1 !== 0);
  const numS2 = Number(side2 !== 0);
  const numC = Number(corner !== 0);

  if (numS1 && numS2) {
    return 0;
  }
  return 3 - (numS1 + numS2 + numC);
}

onmessage = function (e) {
  const {
    data: dataBuffer,
    lights: lightsBuffer,
    configs: { dimension, padding, min, max, stride, blockMats, matUVs },
  } = e.data;

  const useSmoothLight = true;

  const data = new Int8Array(dataBuffer);
  const lights = new Int8Array(lightsBuffer);

  const positions = [];
  const normals = [];
  const indices = [];
  const uvs = [];
  const aos = [];
  let lightLevels = [];

  const [startX, startY, startZ] = min;
  const [endX, endY, endZ] = max;

  const vertexToLight = new Map();

  for (let vx = startX, lx = padding; vx < endX; ++vx, ++lx) {
    for (let vy = startY, ly = padding; vy < endY; ++vy, ++ly) {
      for (let vz = startZ, lz = padding; vz < endZ; ++vz, ++lz) {
        const voxel = get(data, lx, ly, lz, stride);

        if (voxel) {
          const { material } = blockMats[voxel];
          const isArrayMat = Array.isArray(material);
          const isMat3 = isArrayMat ? material.length === 3 : false;

          // There is a voxel here but do we need faces for it?
          for (const { dir, mat3, mat6, corners, neighbors } of FACES) {
            // neighbor local xyz
            const nlx = lx + dir[0];
            const nly = ly + dir[1];
            const nlz = lz + dir[2];

            const neighbor = get(data, nlx, nly, nlz, stride);

            if (!neighbor) {
              const lightLevel = getTorchLight(lights, nlx, nly, nlz, stride);
              // this voxel has no neighbor in this direction so we need a face.
              const nearVoxels = neighbors.map(([a, b, c]) => get(data, lx + a, ly + b, lz + c, stride));
              const { startU, endU, startV, endV } = isArrayMat
                ? isMat3
                  ? matUVs[material[mat3]]
                  : matUVs[material[mat6]]
                : matUVs[material];

              const ndx = positions.length / 3;
              const faceAOs = [];

              for (const { pos, uv, side1, side2, corner } of corners) {
                const posX = pos[0] + vx;
                const posY = pos[1] + vy;
                const posZ = pos[2] + vz;

                if (useSmoothLight) {
                  const rep = toRep(posX * dimension, posY * dimension, posZ * dimension);
                  if (vertexToLight.has(rep)) {
                    const { count, level } = vertexToLight.get(rep);
                    vertexToLight.set(rep, {
                      count: count + 1,
                      level: level + lightLevel,
                    });
                  } else {
                    vertexToLight.set(rep, {
                      count: 1,
                      level: lightLevel,
                    });
                  }
                  const test = [
                    [posX, startX, [-1, 0, 0]],
                    [posY, startY, [0, -1, 0]],
                    [posZ, startZ, [0, 0, -1]],
                    // position can be voxel + 1, thus can reach end
                    [posX, endX, [1, 0, 0]],
                    [posY, endY, [0, 1, 0]],
                    [posZ, endZ, [0, 0, 1]],
                  ];
                  test.forEach(([posA, posB, [a, b, c]]) => {
                    if (posA === posB) {
                      const lightLevelN = getTorchLight(lights, nlx + a, nly + b, nlz + c, stride);
                      const { count, level } = vertexToLight.get(rep);
                      vertexToLight.set(rep, {
                        count: count + 1,
                        level: level + lightLevelN,
                      });
                    }
                  });
                  lightLevels.push(rep);
                }
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
              if (!useSmoothLight) {
                lightLevels.push(lightLevel, lightLevel, lightLevel, lightLevel);
              }
            }
          }
        }
      }
    }
  }

  // console.log(
  //   Array.from(vertexToLight.keys())
  //     .map((k) => vertexToLight.get(k))
  //     .filter((vtl) => vtl.count !== 4)
  //     .map((k) => k.count),
  // );

  if (useSmoothLight) {
    lightLevels = lightLevels.map((rep) => {
      const { count, level } = vertexToLight.get(rep);
      return level / count;
    });
  }

  const positionsArrayBuffer = new Float32Array(positions).buffer;
  const normalsArrayBuffer = new Float32Array(normals).buffer;
  const indicesArrayBuffer = new Float32Array(indices).buffer;
  const uvsArrayBuffer = new Float32Array(uvs).buffer;
  const aosArrayBuffer = new Float32Array(aos).buffer;
  const lightLevelsArrayBuffer = new Float32Array(lightLevels).buffer;

  postMessage(
    {
      positions: positionsArrayBuffer,
      normals: normalsArrayBuffer,
      indices: indicesArrayBuffer,
      uvs: uvsArrayBuffer,
      aos: aosArrayBuffer,
      lights: lightLevelsArrayBuffer,
    },
    [
      positionsArrayBuffer,
      normalsArrayBuffer,
      indicesArrayBuffer,
      uvsArrayBuffer,
      aosArrayBuffer,
      lightLevelsArrayBuffer,
    ],
  );
};
