import { Chunk, World } from '../../app';
import { Helper } from '../../utils';
import { Coords2, Coords3, LightNode } from '../types';

import workerSrc from '!raw-loader!./workers/fill-lights.worker';

const DEFAULT_WORKER_COUNT = 20;
const workers: Worker[] = [];

for (let i = 0; i < DEFAULT_WORKER_COUNT; i++) {
  workers.push(Helper.loadWorker(workerSrc));
}

type FillResultsType = {
  lights: Int8Array;
  simpleSets: { level: number; voxel: Coords3; coords: Coords2 }[];
  continueQueues: {
    [name: string]: LightNode[];
  };
};

async function fillLights(queue: LightNode[], world: World): Promise<void> {
  if (queue.length === 0) return;

  const { voxel: firstVoxel } = queue[0];
  const chunk = world.getChunkByVoxel(firstVoxel);

  // chunk isn't even in range
  if (!chunk) return;

  const { voxels, lights, padding, size, minOuter, maxOuter, minInner, maxInner, maxHeight, coords, heightMap } = chunk;
  const { stride } = voxels;
  const { stride: hmStride } = heightMap;

  queue.forEach(({ voxel, level }) => {
    world.setTorchLight(voxel, level);
  });

  const voxelsBuffer = (voxels.data as Int8Array).buffer.slice(0);
  const lightsBuffer = (lights.data as Int8Array).buffer.slice(0);
  const heightMapBuffer = (heightMap.data as Int8Array).buffer.slice(0);
  const worker = workers.pop() || Helper.loadWorker(workerSrc);

  const { lights: newChunkLights, continueQueues, simpleSets } = await new Promise<FillResultsType>((resolve) => {
    worker.postMessage(
      {
        queue,
        data: voxelsBuffer,
        lights: lightsBuffer,
        heightMap: heightMapBuffer,
        configs: {
          padding,
          coords,
          stride,
          size,
          hmStride,
          minOuter,
          maxOuter,
          minInner,
          maxInner,
          maxHeight,
        },
      },
      [voxelsBuffer, lightsBuffer, heightMapBuffer],
    );

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
    const newQueue = continueQueues[name];
    await fillLights(newQueue, world);
  }

  if (workers.length < DEFAULT_WORKER_COUNT) {
    workers.push(worker);
  }
}

export { fillLights };
