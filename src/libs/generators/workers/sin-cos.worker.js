function set(arr, x, y, z, stride, value) {
  arr[x * stride[0] + y * stride[1] + z * stride[2]] = value;
  return value;
}

function getVoxelAt(vx, vy, vz, types, maxHeight) {
  let blockID = 0;

  if (vy >= maxHeight) return 0;
  if (vy === 0) return types.stone;
  if (vy < 0) return 0;

  const height = Math.abs(5 * Math.sin(vx / 10) + 8 * Math.cos(vz / 20) + 10);
  if (vy < height) {
    blockID = Math.random() > 0.5 ? types.grass : types.stone;
  }

  return blockID;
}

self.onmessage = function (e) {
  const {
    data: dataBuffer,
    configs: { min, max, stride, types, maxHeight },
  } = e.data;

  const data = new Int8Array(dataBuffer);

  const [startX, startY, startZ] = min;
  const [endX, endY, endZ] = max;

  let isEmpty = true;

  for (let vx = startX, lx = 0; vx < endX; ++vx, ++lx) {
    for (let vy = startY, ly = 0; vy < endY; ++vy, ++ly) {
      for (let vz = startZ, lz = 0; vz < endZ; ++vz, ++lz) {
        const voxel = getVoxelAt(vx, vy, vz, types, maxHeight);
        if (voxel) {
          isEmpty = false;
          set(data, lx, ly, lz, stride, voxel);
        }
      }
    }
  }

  postMessage({ voxels: data.buffer, isEmpty }, [data.buffer]);
};
