function contains(voxel, min, max) {
  const [sx, sy, sz] = min;
  const [ex, ey, ez] = max;
  const [vx, vy, vz] = voxel;
  return vx < ex && vx >= sx && vy < ey && vy >= sy && vz < ez && vz >= sz;
}

function inPadding(voxel, coords, padding, size) {
  const [cx, cy, cz] = coords;
  return (
    contains(
      voxel,
      [cx * size - padding, cy * size - padding, cz * size - padding],
      [(cx + 1) * size + padding, (cy + 1) * size + padding, (cz + 1) * size + padding],
    ) && !contains(voxel, [cx * size, cy * size, cz * size], [(cx + 1) * size, (cy + 1) * size, (cz + 1) * size])
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

function getTorchLight(arr, x, y, z, stride) {
  return get(arr, x, y, z, stride) & 0xf;
}

function setTorchLight(arr, x, y, z, stride, value) {
  set(arr, x, y, z, stride, (get(arr, x, y, z, stride) & 0xf0) | value);
}

function toName(coords) {
  return `${coords[0]}|${coords[1]}|${coords[2]}`;
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

const sunlightDirections = [
  [1, 0, 0, -1],
  [-1, 0, 0, -1],
  [0, -1, 0, -1],
  [0, 0, 1, -1],
  [0, 0, -1, -1],
];

onmessage = function (e) {
  const {
    queue,
    isSunlight,
    data: dataBuffer,
    lights: lightsBuffer,
    configs: { padding, coords, stride, size, minOuter, maxOuter, minInner, maxInner },
  } = e.data;

  const [cx, cy, cz] = coords;

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
        const ncy = Math.floor(vy / size);
        const ncz = Math.floor(vz / size);

        const name = toName(ncx, ncy, ncz);
        if (continueQueues[name]) continueQueues[name].push(lightNode);
        else continueQueues[name] = [lightNode];

        continue;
      }

      (isSunlight ? sunlightDirections : directions).forEach(([dirX, dirY, dirZ, delta]) => {
        // new neighboring BLOCK
        const newVX = vx + dirX;
        const newVY = vy + dirY;
        const newVZ = vz + dirZ;

        delta = isSunlight ? delta : -1;

        const [newLX, newLY, newLZ] = toLocal([newVX, newVY, newVZ], minOuter);

        const newCX = Math.floor(newVX / size);
        const newCY = Math.floor(newVY / size);
        const newCZ = Math.floor(newVZ / size);

        const newVoxel = [newVX, newVY, newVZ];
        const newCoords = [newCX, newCY, newCZ];
        const newNode = {
          level: level + delta,
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
          setTorchLight(lights, newLX, newLY, newLZ, stride, level + delta);

          // TODO: FASTER WAY OF DOING SO
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              for (let k = -1; k <= 1; k++) {
                if (i === 0 && j === 0 && k == 0) continue;
                const nCoords = [cx + i, cy + j, cz + k];
                if (inPadding(newVoxel, nCoords, padding, size)) {
                  simpleSets.push({
                    ...newNode,
                    coords: nCoords,
                  });
                }
              }
            }
          }

          // this means the newVoxel is in the padding of the current chunk
          // thus, should set neighboring coords.
          if (inPadding(newVoxel, coords, padding, size)) {
            simpleSets.push({
              ...newNode,
              coords: newCoords,
            });
          }

          queue.push(newNode);
        }
      });
    }
  }

  postMessage({ lights: lights.buffer, simpleSets, continueQueues }, [lights.buffer]);
};
