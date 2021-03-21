function set(arr, x, y, z, stride, value) {
  arr[x * stride[0] + y * stride[1] + z * stride[2]] = value;
  return value;
}

function getVoxelAt(vx, vy, vz, types) {
  let blockID = 0;

  const height = 5 * Math.cos(vx / 10) + 8 * Math.sin(vz / 20);
  if (vy < height) {
    blockID = Math.random() > 0.5 ? types.grass : types.stone;
  }

  // if (vy === -1) blockID = types.grass;
  // else if (vy < -1 && vy >= -3) blockID = types.dirt;
  // else if (vy < -3) blockID = types.stone;

  return blockID;
}

self.onmessage = function (e) {
  const {
    data: dataBuffer,
    configs: { min, max, stride, types },
  } = e.data;

  const data = new Int8Array(dataBuffer);

  const [startX, startY, startZ] = min;
  const [endX, endY, endZ] = max;

  let isEmpty = true;

  for (let vx = startX, lx = 0; vx < endX; ++vx, ++lx) {
    for (let vy = startY, ly = 0; vy < endY; ++vy, ++ly) {
      for (let vz = startZ, lz = 0; vz < endZ; ++vz, ++lz) {
        const voxel = getVoxelAt(vx, vy, vz, types);
        if (voxel) {
          isEmpty = false;
          set(data, lx, ly, lz, stride, voxel);
        }
      }
    }
  }

  postMessage({ voxels: data.buffer, isEmpty }, [data.buffer]);
};
