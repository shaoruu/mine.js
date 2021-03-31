// Engine options object, and engine instantiation:
const { Engine } = MineJS;

const engine = new Engine({
  renderRadius: 5,
});

engine.on('data-needed', async (chunk) => {
  await generateData(chunk);
  chunk.initialized();
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
  const { voxels, minOuter, maxOuter } = chunk;
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
        },
      },
      [voxelsBuffer],
    );

    worker.onmessage = ({ data }) => {
      const { voxels } = data;
      resolve(new Int8Array(voxels));
    };
  });

  chunk.voxels.data = newVoxels;

  // ?: DEBATABLE
  if (workers.length < DEFAULT_WORKER_COUNT) {
    workers.push(worker);
  }
}

engine.start();
