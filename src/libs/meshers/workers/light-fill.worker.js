function encodeIndex(x, y, z, stride) {
  return x * stride[0] + y * stride[1] + z * stride[2];
}

function get(arr, x, y, z, stride) {
  return arr[encodeIndex(x, y, z, stride)];
}

function set(arr, x, y, z, stride, value) {
  const index = encodeIndex(x, y, z, stride);
  if (index >= arr.length) return;
  arr[index] = value;
  return value;
}

// function getSunlight(arr, x, y, z, stride) {
//   return (get(arr, x, y, z, stride) >> 4) & 0xf;
// }

// function setSunlight(arr, x, y, z, stride, value) {
//   set(arr, x, y, z, stride, (get(arr, x, y, z, stride) & 0xf) | (value << 4));
// }

function getTorchLight(arr, x, y, z, stride) {
  return get(arr, x, y, z, stride) & 0xf;
}

function setTorchLight(arr, x, y, z, stride, value) {
  set(arr, x, y, z, stride, (get(arr, x, y, z, stride) & 0xf0) | value);
}

onmessage = function (e) {
  const {
    lightLevel,
    data: dataBuffer,
    lights: lightsBuffer,
    source: [lightVX, lightVY, lightVZ],
    configs: { stride, padding, min },
  } = e.data;

  const data = new Int8Array(dataBuffer);
  const lights = new Int8Array(lightsBuffer);

  const [startX, startY, startZ] = min;

  const lightLX = lightVX - startX + padding;
  const lightLY = lightVY - startY + padding;
  const lightLZ = lightVZ - startZ + padding;

  const lightBfsQueue = [];

  // set source as light
  setTorchLight(lights, lightLX, lightLY, lightLZ, stride, lightLevel);

  lightBfsQueue.push([lightLX, lightLY, lightLZ]);

  while (lightBfsQueue.length !== 0) {
    const [lx, ly, lz] = lightBfsQueue.shift();
    const lightLevel = getTorchLight(lights, lx, ly, lz, stride);

    // continue if light is outside of lights
    if (lightLevel === undefined) continue;

    // px
    if (get(data, lx + 1, ly, lz, stride) === 0 && getTorchLight(lights, lx + 1, ly, lz, stride) + 2 <= lightLevel) {
      setTorchLight(lights, lx + 1, ly, lz, stride, lightLevel - 1);
      lightBfsQueue.push([lx + 1, ly, lz]);
    }

    // nx
    if (get(data, lx - 1, ly, lz, stride) === 0 && getTorchLight(lights, lx - 1, ly, lz, stride) + 2 <= lightLevel) {
      setTorchLight(lights, lx - 1, ly, lz, stride, lightLevel - 1);
      lightBfsQueue.push([lx - 1, ly, lz]);
    }

    // py
    if (get(data, lx, ly + 1, lz, stride) === 0 && getTorchLight(lights, lx, ly + 1, lz, stride) + 2 <= lightLevel) {
      setTorchLight(lights, lx, ly + 1, lz, stride, lightLevel - 1);
      lightBfsQueue.push([lx, ly + 1, lz]);
    }

    // ny
    if (get(data, lx, ly - 1, lz, stride) === 0 && getTorchLight(lights, lx, ly - 1, lz, stride) + 2 <= lightLevel) {
      setTorchLight(lights, lx, ly - 1, lz, stride, lightLevel - 1);
      lightBfsQueue.push([lx, ly - 1, lz]);
    }

    // pz
    if (get(data, lx, ly, lz + 1, stride) === 0 && getTorchLight(lights, lx, ly, lz + 1, stride) + 2 <= lightLevel) {
      setTorchLight(lights, lx, ly, lz + 1, stride, lightLevel - 1);
      lightBfsQueue.push([lx, ly, lz + 1]);
    }

    // nz
    if (get(data, lx, ly, lz - 1, stride) === 0 && getTorchLight(lights, lx, ly, lz - 1, stride) + 2 <= lightLevel) {
      setTorchLight(lights, lx, ly, lz - 1, stride, lightLevel - 1);
      lightBfsQueue.push([lx, ly, lz - 1]);
    }
  }

  const lightsArrayBuffer = lights.buffer;

  postMessage({ lights: lightsArrayBuffer }, [lightsArrayBuffer]);
};
