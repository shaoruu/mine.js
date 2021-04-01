// Engine options object, and engine instantiation:
const { Engine } = MineJS;

const engine = new Engine();

engine.on('data-needed', async (chunk) => {
  await generateData(chunk);
  await chunk.initialized();
});

// make a terrain worker
function makeWorker() {
  return new Worker('worker.js');
}

const DEFAULT_WORKER_COUNT = 20;
const workers = [];

for (let i = 0; i < DEFAULT_WORKER_COUNT; i++) {
  workers.push(makeWorker());
}

async function generateData(chunk) {
  const { voxels, minOuter, maxOuter, maxHeight } = chunk;
  const { stride } = voxels;

  const voxelsBuffer = voxels.data.buffer.slice(0);
  const worker = workers.pop() || makeWorker();

  const newVoxels = await new Promise((resolve) => {
    worker.postMessage(
      {
        data: voxelsBuffer,
        configs: {
          stride,
          min: minOuter,
          max: maxOuter,
          maxHeight,
        },
      },
      [voxelsBuffer],
    );

    worker.onmessage = ({ data }) => {
      const { voxels } = data;
      resolve(new Uint8Array(voxels));
    };
  });

  chunk.voxels.data = newVoxels;

  // ?: DEBATABLE
  if (workers.length < DEFAULT_WORKER_COUNT) {
    workers.push(worker);
  }
}

engine.registry.addMaterial('sea', { color: '#d4f1f9' });
// engine.registry.addMaterial('dirt1', { color: '#90571D' });
// engine.registry.addMaterial('dirt2', { color: '#EE9046' });
// engine.registry.addMaterial('dirt3', { color: '#E1C4A5' });
// engine.registry.addMaterial('dirt1', { color: '#40e0d0' });
// engine.registry.addMaterial('dirt2', { color: '#006400' });
// engine.registry.addMaterial('dirt3', { color: '#00FFFF' });
engine.registry.addMaterial('dirt1', { color: '#89cff0' });
engine.registry.addMaterial('dirt2', { color: '#f4c2c2' });
engine.registry.addMaterial('dirt3', { color: '#f8f8ff' });
engine.registry.addBlock('stone', 'dirt1');
engine.registry.addBlock('dirt', 'dirt2');
engine.registry.addBlock('grass', 'dirt3');
engine.registry.addBlock('sea', 'sea');

document.addEventListener(
  'mousedown',
  ({ button }) => {
    if (!engine.isLocked) return;

    if (button === 0) {
      engine.world.breakVoxel();
    } else if (button === 1) {
      if (!engine.camera.targetBlock) return;
      const [ctx, cty, ctz] = engine.camera.targetBlock;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          for (let k = -1; k <= 1; k++) {
            engine.world.setVoxel([ctx + i, cty + j, ctz + k], 3);
          }
        }
      }
    } else if (button === 2) {
      engine.world.placeVoxel(2);
    }
  },
  false,
);

document.addEventListener('keypress', ({ key }) => {
  const range = 8;
  if (key === 'f') {
    const [px, py, pz] = engine.camera.voxel;
    for (let i = -range; i <= range; i++) {
      for (let j = -range; j <= range; j++) {
        for (let k = -range; k <= range; k++) {
          engine.world.setVoxel([px + i, py + j, pz + k], 0);
        }
      }
    }
  } else if (key === 'r') {
    if (!engine.camera.lookBlock) return;
    const [clx, cly, clz] = engine.camera.lookBlock;
    for (let i = -range; i <= range; i++) {
      for (let j = -range; j <= range; j++) {
        for (let k = -range; k <= range; k++) {
          if (i * i + j * j + k * k > range * range) continue;

          engine.world.setVoxel([clx + i, cly + j, clz + k], 0);
        }
      }
    }
  } else if (key === 'x') {
    if (!engine.camera.lookBlock) return;
    const [clx, cly, clz] = engine.camera.lookBlock;
    for (let i = -range; i <= range; i++) {
      for (let j = -range; j <= range; j++) {
        for (let k = -range; k <= range; k++) {
          if (i * i + j * j + k * k > range * range) continue;

          engine.world.setVoxel([clx + i, cly + j, clz + k], 1);
        }
      }
    }
  } else if (key === 'z') {
    const [px, py, pz] = engine.camera.voxel;
    for (let i = -range; i <= range; i++) {
      for (let j = -range; j <= range; j++) {
        engine.world.setVoxel([px + i, py + 2, pz + j], 1);
      }
    }
  }
});

engine.start();
