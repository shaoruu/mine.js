function contains(voxel, min, max) {
  const [sx, sy, sz] = min;
  const [ex, ey, ez] = max;
  const [vx, vy, vz] = voxel;
  return vx < ex && vx >= sx && vy < ey && vy >= sy && vz < ez && vz >= sz;
}

function inPadding(voxel, coords, padding, size, maxHeight) {
  const [cx, cz] = coords;
  return (
    contains(
      voxel,
      [cx * size - padding, 0, cz * size - padding],
      [(cx + 1) * size + padding, maxHeight, (cz + 1) * size + padding],
    ) && !contains(voxel, [cx * size, 0, cz * size], [(cx + 1) * size, maxHeight, (cz + 1) * size])
  );
}

function toLocal(voxel, minOuter) {
  return [voxel[0] - minOuter[0], voxel[1] - minOuter[1], voxel[2] - minOuter[2]];
}

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

function get2(arr, x, z, stride) {
  return arr[x * stride[0] + z * stride[1]];
}

function getTorchLight(arr, x, y, z, stride) {
  return get(arr, x, y, z, stride) & 0xf;
}

function setTorchLight(arr, x, y, z, stride, value) {
  set(arr, x, y, z, stride, (get(arr, x, y, z, stride) & 0xf0) | value);
}

function getSunlight(arr, x, y, z, stride) {
  return (get(arr, x, y, z, stride) >> 4) & 0xf;
}

function setSunlight(arr, x, y, z, stride, value) {
  set(arr, x, y, z, stride, (get(arr, x, y, z, stride) & 0xf) | (value << 4));
}

function toName(coords) {
  return `${coords[0]}|${coords[1]}`;
}

// sample queue:
//
// type LightNode = {
//   voxel,
//   level
// }
//

const directions = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

onmessage = function (e) {
  const {
    queue,
    data: dataBuffer,
    lights: lightsBuffer,
    configs: { padding, coords, stride, size, minOuter, maxOuter, maxHeight },
  } = e.data;

  const [cx, cz] = coords;

  const data = new Int8Array(dataBuffer);
  const lights = new Int8Array(lightsBuffer);

  const continueQueues = {}; // for propagation continuation
  const simpleSets = [];

  // propagate through queue until it's empty
  while (queue.length) {
    const lightNode = queue.shift();

    if (lightNode) {
      const { level, voxel } = lightNode;
      const [vx, vy, vz] = voxel;

      // the voxel is outside of the current chunk, thus push it to continueQueues
      if (level !== 0 && !contains(voxel, minOuter, maxOuter)) {
        const ncx = Math.floor(vx / size);
        const ncz = Math.floor(vz / size);

        const name = toName(ncx, ncz);
        if (continueQueues[name]) continueQueues[name].push(lightNode);
        else continueQueues[name] = [lightNode];

        continue;
      }

      directions.forEach(([dirX, dirY, dirZ]) => {
        // new neighboring BLOCK
        const newVX = vx + dirX;
        const newVY = vy + dirY;
        const newVZ = vz + dirZ;

        const [newLX, newLY, newLZ] = toLocal([newVX, newVY, newVZ], minOuter);

        const newCX = Math.floor(newVX / size);
        const newCZ = Math.floor(newVZ / size);

        const newVoxel = [newVX, newVY, newVZ];
        const newCoords = [newCX, newCZ];
        const newNode = {
          level: level + -1,
          voxel: newVoxel,
        };

        // if the neighboring block is outside of chunk, add it to continueQueues
        if (newNode.level !== 0 && !contains(newVoxel, minOuter, maxOuter)) {
          const name = toName(newCoords);

          if (continueQueues[name]) continueQueues[name].push(newNode);
          else continueQueues[name] = [newNode];

          return;
        }

        if (
          get(data, newLX, newLY, newLZ, stride) === 0 &&
          getTorchLight(lights, newLX, newLY, newLZ, stride) + 2 <= level
        ) {
          setTorchLight(lights, newLX, newLY, newLZ, stride, level - 1);

          // TODO: FASTER WAY OF DOING SO
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              if (i === 0 && j == 0) continue;
              const nCoords = [cx + i, cz + j];
              if (inPadding(newVoxel, nCoords, padding, size, maxHeight)) {
                simpleSets.push({
                  ...newNode,
                  coords: nCoords,
                });
              }
            }

            // this means the newVoxel is in the padding of the current chunk
            // thus, should set neighboring coords.
            if (inPadding(newVoxel, coords, padding, size, maxHeight)) {
              simpleSets.push({
                ...newNode,
                coords: newCoords,
              });
            }
          }

          queue.push(newNode);
        }
      });
    }
  }

  postMessage({ lights: lights.buffer, simpleSets, continueQueues }, [lights.buffer]);
};
