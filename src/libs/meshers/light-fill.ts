import { Chunk } from '../../app';
import { Helper } from '../../utils';
import { Coords3 } from '../types';

import workerSrc from '!raw-loader!./workers/light-fill.worker';

const DEFAULT_WORKER_COUNT = 20;
const workers: Worker[] = [];

for (let i = 0; i < DEFAULT_WORKER_COUNT; i++) {
  workers.push(Helper.loadWorker(workerSrc));
}

type LightFillResultType = {
  lights: Int8Array;
};

async function lightFill(lightLevel: number, voxel: Coords3, chunk: Chunk) {
  const { voxels, lights, minInner, padding } = chunk;
  const { stride } = voxels;

  const voxelsBuffer = (voxels.data as Int8Array).buffer.slice(0);
  const lightsBuffer = (lights.data as Int8Array).buffer.slice(0);
  const worker = workers.pop() || Helper.loadWorker(workerSrc);

  const result = await new Promise<LightFillResultType>((resolve) => {
    worker.postMessage(
      {
        lightLevel,
        data: voxelsBuffer,
        lights: lightsBuffer,
        source: voxel,
        configs: {
          stride,
          padding,
          min: minInner,
        },
      },
      [voxelsBuffer, lightsBuffer],
    );

    worker.onmessage = ({ data }) => {
      const { lights } = data;
      resolve({
        lights: new Int8Array(lights),
      });
    };
  });

  workers.push(worker);

  return result;
}

export { lightFill };
