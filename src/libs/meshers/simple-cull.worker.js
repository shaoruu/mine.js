const get = (arr, x, y, z, stride) => {
  return arr[x * stride[0] + y * stride[1] + z * stride[2]];
};

const FACES = [
  {
    // left
    dir: [-1, 0, 0],
    mat: 3, // nx
    corners: [
      { pos: [0, 1, 0], uv: [0, 1] },
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [0, 0, 1], uv: [1, 0] },
    ],
  },
  {
    // right
    dir: [1, 0, 0],
    mat: 0, // px
    corners: [
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [1, 0, 1], uv: [0, 0] },
      { pos: [1, 1, 0], uv: [1, 1] },
      { pos: [1, 0, 0], uv: [1, 0] },
    ],
  },
  {
    // bottom
    dir: [0, -1, 0],
    mat: 4, // ny
    corners: [
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 0], uv: [1, 1] },
      { pos: [0, 0, 0], uv: [0, 1] },
    ],
  },
  {
    // top
    dir: [0, 1, 0],
    mat: 1, // py
    corners: [
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 0] },
    ],
  },
  {
    // back
    dir: [0, 0, -1],
    mat: 5, // nz
    corners: [
      { pos: [1, 0, 0], uv: [0, 0] },
      { pos: [0, 0, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 1] },
    ],
  },
  {
    // front
    dir: [0, 0, 1],
    mat: 2, // pz
    corners: [
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 1, 1], uv: [0, 1] },
      { pos: [1, 1, 1], uv: [1, 1] },
    ],
  },
];

onmessage = function (e) {
  const {
    data: dataBuffer,
    configs: { dimension, padding, min, max, stride, blockMats, matUVs },
  } = e.data;

  const data = new Int8Array(dataBuffer);

  const positions = [];
  const normals = [];
  const indices = [];
  const uvs = [];

  const [startX, startY, startZ] = min;
  const [endX, endY, endZ] = max;

  for (let vx = startX, lx = padding; vx < endX; ++vx, ++lx) {
    for (let vy = startY, ly = padding; vy < endY; ++vy, ++ly) {
      for (let vz = startZ, lz = padding; vz < endZ; ++vz, ++lz) {
        const voxel = get(data, lx, ly, lz, stride);

        if (voxel) {
          const { material } = blockMats[voxel];
          const isArrayMat = Array.isArray(material);

          // There is a voxel here but do we need faces for it?
          for (const { dir, mat, corners } of FACES) {
            const neighbor = get(data, lx + dir[0], ly + dir[1], lz + dir[2], stride);
            if (!neighbor) {
              const { startU, endU, startV, endV } = isArrayMat ? matUVs[material[mat]] : matUVs[material];
              // this voxel has no neighbor in this direction so we need a face.
              const ndx = positions.length / 3;
              for (const { pos, uv } of corners) {
                positions.push((pos[0] + vx) * dimension, (pos[1] + vy) * dimension, (pos[2] + vz) * dimension);
                normals.push(...dir);
                uvs.push(uv[0] * (endU - startU) + startU, uv[1] * (startV - endV) + endV);
              }
              indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
            }
          }
        }
      }
    }
  }

  const positionsArrayBuffer = new Float32Array(positions).buffer;
  const normalsArrayBuffer = new Float32Array(normals).buffer;
  const indicesArrayBuffer = new Float32Array(indices).buffer;
  const uvsArrayBuffer = new Float32Array(uvs).buffer;

  postMessage(
    {
      positions: positionsArrayBuffer,
      normals: normalsArrayBuffer,
      indices: indicesArrayBuffer,
      uvs: uvsArrayBuffer,
    },
    [positionsArrayBuffer, normalsArrayBuffer, indicesArrayBuffer, uvsArrayBuffer],
  );
};
