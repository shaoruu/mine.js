function set(arr, x, y, z, stride, value) {
  arr[x * stride[0] + y * stride[1] + z * stride[2]] = value;
  return value;
}

function getVoxelAt(vx, vy, vz, types) {
  let blockID = 0;

  if (vy < -3) blockID = 3;
  else {
    const height = 2 * Math.E ** Math.cos(vx / 10) + 3 * Math.E ** Math.sin(vz / 20) + 3;
    if (vy < height) {
      blockID = Math.random() > 0.5 ? types.grass : types.stone;
    }
  }

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

  const voxelsBuffer = new Int8Array(dataBuffer).buffer;

  postMessage({ voxels: voxelsBuffer, isEmpty }, [voxelsBuffer]);
};
