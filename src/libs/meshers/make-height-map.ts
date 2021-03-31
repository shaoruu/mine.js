import { Chunk } from '../../app';
import { Helper } from '../../utils';

import workerSrc from '!raw-loader!./workers/make-height-map.worker';

const DEFAULT_WORKER_COUNT = 20;
const workers: Worker[] = [];

for (let i = 0; i < DEFAULT_WORKER_COUNT; i++) {
  workers.push(Helper.loadWorker(workerSrc));
}

async function makeHeightMap(chunk: Chunk): Promise<void> {
  const { voxels, heightMap, padding, minInner, maxInner } = chunk;
  const { stride: hmStride } = heightMap;
  const { stride } = voxels;

  const voxelsBuffer = (voxels.data as Int8Array).buffer.slice(0);
  const heightMapBuffer = (heightMap.data as Int8Array).buffer.slice(0);
  const worker = workers.pop() || Helper.loadWorker(workerSrc);

  const newHeightMapData = await new Promise<Int8Array>((resolve) => {
    worker.postMessage(
      {
        data: voxelsBuffer,
        heightMap: heightMapBuffer,
        configs: {
          padding,
          min: minInner,
          max: maxInner,
          stride,
          hmStride,
        },
      },
      [voxelsBuffer, heightMapBuffer],
    );

    worker.onmessage = ({ data: newHeightMapBuffer }) => {
      resolve(new Int8Array(newHeightMapBuffer));
    };
  });

  heightMap.data = newHeightMapData;

  if (workers.length < DEFAULT_WORKER_COUNT) {
    workers.push(worker);
  }
}

export { makeHeightMap };
