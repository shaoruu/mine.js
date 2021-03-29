function get(arr, x, y, z, stride) {
  return arr[x * stride[0] + y * stride[1] + z * stride[2]];
}

function set2(arr, x, z, stride, value) {
  arr[x * stride[0] + z * stride[1]] = value;
}

onmessage = function (e) {
  const {
    data: dataBuffer,
    configs: { stride, padding, size },
  } = e.data;

  const data = new Int8Array(dataBuffer);

  const heightMap = new Int8Array((size + 2 * padding) * (size + 2 * padding));
  const heightStride = [size + 2 * padding, 1];

  for (let lx = 0; lx < size + padding * 2; lx++) {
    for (let lz = 0; lz < size + padding * 2; lz++) {
      // top of maxInner.y
      if (get(data, lx, size + padding - 1, lz, stride) !== 0) {
        // top block is not solid, should be something else then
        set2(heightMap, lx, lz, heightStride, -1);
      } else {
        set2(heightMap, lx, lz, heightStride, size + padding - 1);
      }
    }
  }
};
