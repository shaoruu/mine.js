importScripts('config.js');
importScripts('perlin.js');

let test = 0;

const { noise } = NOISE;
noise.seed(123123);

function set(arr, x, y, z, stride, value) {
  arr[x * stride[0] + y * stride[1] + z * stride[2]] = value;
  return value;
}

function getOctavePerlin3(x, y, z) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxVal = 0;

  for (let i = 0; i < OCTAVES; i++) {
    total += noise.perlin3(x * frequency * SCALE, y * frequency * SCALE, z * frequency * SCALE) * amplitude;

    maxVal += amplitude;

    amplitude *= PERSISTANCE;
    frequency *= LACUNARITY;
  }

  return (total / maxVal) * AMPLIFIER + HEIGHT_OFFSET;
}

function getVoxelAt(vx, vy, vz) {
  let blockID = 0;

  const perlinValue = noise.perlin3(vx * SCALE, vy * SCALE, vz * SCALE);

  if (test < 10) {
    // console.log(perlinValue);
    test++;
  }

  if (perlinValue > -0.2) {
    blockID = Math.random() > 0.5 ? 3 : 2;
  }

  // const test = noise.perlin3(vx * SCALE, vy * SCALE, vz * SCALE) * 10;
  // const value = (test + 0.5) * 2 + 100;

  // if (vy < value) {
  //   blockID = 2;
  // }

  // if (vy < -3) blockID = 3;
  // else {
  //   const height = 2 * Math.sin(vx / 10) + 3 * Math.cos(vz / 20) + 3;
  //   if (vy < height) {
  //     blockID = Math.random() > 0.5 ? 1 : 2;
  //   }
  // }

  return blockID;
}

self.onmessage = function (e) {
  const {
    data: dataBuffer,
    configs: { min, max, stride },
  } = e.data;

  const data = new Uint8Array(dataBuffer);

  const [startX, startY, startZ] = min;
  const [endX, endY, endZ] = max;

  for (let vx = startX, lx = 0; vx < endX; ++vx, ++lx) {
    for (let vy = startY, ly = 0; vy < endY; ++vy, ++ly) {
      for (let vz = startZ, lz = 0; vz < endZ; ++vz, ++lz) {
        const voxel = getVoxelAt(vx, vy, vz);
        set(data, lx, ly, lz, stride, voxel);
      }
    }
  }

  postMessage({ voxels: data.buffer }, [data.buffer]);
};
