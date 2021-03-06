import { Chunk } from '../../app';
import { Helper } from '../../utils';
import { MeshResultType } from '../types';

import workerSrc from '!raw-loader!./simple-cull.worker';

const workers: Worker[] = [];

for (let i = 0; i < 10; i++) {
  workers.push(Helper.loadWorker(workerSrc));
}

async function simpleCull(chunk: Chunk): Promise<MeshResultType> {
  const { dimension, padding, voxels, minInner, maxInner } = chunk;
  const { stride } = voxels;

  const voxelsBuffer = (voxels.data as Int8Array).buffer;
  const worker = workers.pop() || Helper.loadWorker(workerSrc);

  const result = await new Promise<MeshResultType>((resolve) => {
    worker.postMessage(
      {
        data: voxelsBuffer,
        configs: {
          dimension,
          padding,
          min: minInner,
          max: maxInner,
          stride,
        },
      },
      [voxelsBuffer],
    );

    worker.onmessage = ({ data }) => {
      const { positions, normals, indices } = data;
      resolve({
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        indices: new Float32Array(indices),
      });
    };
  });

  workers.push(worker);

  return result;
}

export { simpleCull };
