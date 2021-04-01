function get(arr, x, y, z, stride) {
  return arr[x * stride[0] + y * stride[1] + z * stride[2]];
}

function set2(arr, x, z, stride, value) {
  arr[x * stride[0] + z * stride[1]] = value;
}

onmessage = function (e) {
  const {
    data: dataBuffer,
    heightMap: heightMapBuffer,
    configs: { padding, min, max, stride, hmStride },
  } = e.data;

  const data = new Uint8Array(dataBuffer);
  const heightMap = new Uint8Array(heightMapBuffer);

  const [startX, startY, startZ] = min;
  const [endX, endY, endZ] = max;

  for (let lx = padding; lx < endX - startX; lx++) {
    for (let lz = padding; lz < endZ - startZ; lz++) {
      let maxHeight = 0;

      for (let ly = endY - startY - 1; ly >= 0; ly--) {
        if (get(data, lx, ly, lz, stride) !== 0) {
          maxHeight = ly;
          break;
        }
      }

      set2(heightMap, lx, lz, hmStride, maxHeight);
    }
  }

  postMessage(heightMap.buffer, [heightMap.buffer]);
};
