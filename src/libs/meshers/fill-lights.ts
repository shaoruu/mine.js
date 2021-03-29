import { Chunk } from '../../app';
import { Helper } from '../../utils';
import { Coords3, LightNode } from '../types';

import workerSrc from '!raw-loader!./workers/fill-lights.worker';

const DEFAULT_WORKER_COUNT = 20;
const workers: Worker[] = [];

for (let i = 0; i < DEFAULT_WORKER_COUNT; i++) {
  workers.push(Helper.loadWorker(workerSrc));
}

type FillResultsType = {
  lights: Int8Array;
  simpleSets: { level: number; voxel: Coords3; coords: Coords3 }[];
  continueQueues: {
    [name: string]: LightNode[];
  };
};

async function fillLights(queue: LightNode[], chunk: Chunk): Promise<void> {
  const {
    voxels,
    lights,
    padding,
    size,
    minOuter,
    maxOuter,
    minInner,
    maxInner,
    coords,
    engine: { world },
  } = chunk;
  const { stride } = voxels;

  queue.forEach(({ voxel, level }) => {
    world.setTorchLight(voxel, level);
  });

  const voxelsBuffer = (voxels.data as Int8Array).buffer.slice(0);
  const lightsBuffer = (lights.data as Int8Array).buffer.slice(0);
  const worker = workers.pop() || Helper.loadWorker(workerSrc);

  const { lights: newChunkLights, continueQueues, simpleSets } = await new Promise<FillResultsType>((resolve) => {
    worker.postMessage({
      queue,
      data: voxelsBuffer,
      lights: lightsBuffer,
      configs: {
        padding,
        coords,
        stride,
        size,
        minOuter,
        maxOuter,
        minInner,
        maxInner,
      },
    });

    worker.onmessage = ({ data }) => {
      const { lights: newLightsBuffer, simpleSets, continueQueues } = data;
      resolve({
        simpleSets,
        continueQueues,
        lights: new Int8Array(newLightsBuffer),
      });
    };
  });

  chunk.lights.data = newChunkLights;
  chunk.isDirty = true;

  // set the paddings of neighboring chunks
  simpleSets.forEach(({ voxel, level, coords }) => {
    const chunk = world.getChunkByCPos(coords);
    chunk?.setTorchLight(...voxel, level);
  });

  // continue propagation
  for (const name of Object.keys(continueQueues)) {
    const coords = Helper.parseChunkName(name);
    const chunk = world.getChunkByCPos(coords as Coords3);
    if (chunk) {
      const newQueue = continueQueues[name];
      chunk.isDirty = true;
      await fillLights(newQueue, chunk);
    }
  }

  if (workers.length < DEFAULT_WORKER_COUNT) {
    workers.push(worker);
  }
}

export { fillLights };
