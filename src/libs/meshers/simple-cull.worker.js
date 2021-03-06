const get = (arr, x, y, z, stride) => {
  return arr[x * stride[0] + y * stride[1] + z * stride[2]];
};

const FACES = [
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

onmessage = function (e) {
  const {
    data: dataBuffer,
    configs: { dimension, padding, min, max, stride },
  } = e.data;

  const data = new Int8Array(dataBuffer);

  const positions = [];
  const normals = [];
  const indices = [];

  const [startX, startY, startZ] = min;
  const [endX, endY, endZ] = max;

  for (let vx = startX, lx = padding; vx < endX; ++vx, ++lx) {
    for (let vy = startY, ly = padding; vy < endY; ++vy, ++ly) {
      for (let vz = startZ, lz = padding; vz < endZ; ++vz, ++lz) {
        const voxel = get(data, lx, ly, lz, stride);

        if (voxel) {
          // There is a voxel here but do we need faces for it?
          for (const { dir, corners } of FACES) {
            const neighbor = get(data, lx + dir[0], ly + dir[1], lz + dir[2], stride);
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

  const positionsArrayBuffer = new Float32Array(positions).buffer;
  const normalsArrayBuffer = new Float32Array(normals).buffer;
  const indicesArrayBuffer = new Float32Array(indices).buffer;

  postMessage({ positions: positionsArrayBuffer, normals: normalsArrayBuffer, indices: indicesArrayBuffer }, [
    positionsArrayBuffer,
    normalsArrayBuffer,
    indicesArrayBuffer,
  ]);
};
