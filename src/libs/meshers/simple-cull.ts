import { Chunk } from '../../app';
import { Helper } from '../../utils';
import { MeshResultType } from '../types';

import workerSrc from '!raw-loader!./simple-cull.worker';

const DEFAULT_WORKER_COUNT = 20;
const workers: Worker[] = [];

for (let i = 0; i < DEFAULT_WORKER_COUNT; i++) {
  workers.push(Helper.loadWorker(workerSrc));
}

async function simpleCull(chunk: Chunk): Promise<MeshResultType> {
  const {
    dimension,
    padding,
    voxels,
    minInner,
    maxInner,
    engine: {
      registry: { cBlockDictionary, cMaterialUVDictionary },
    },
  } = chunk;
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
          blockMats: cBlockDictionary,
          matUVs: cMaterialUVDictionary,
        },
      },
      [voxelsBuffer],
    );

    worker.onmessage = ({ data }) => {
      const { positions, normals, indices, uvs, aos } = data;
      resolve({
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        indices: new Float32Array(indices),
        uvs: new Float32Array(uvs),
        aos: new Float32Array(aos),
      });
    };
  });

  //? DEBATABLE
  if (workers.length < DEFAULT_WORKER_COUNT) {
    workers.push(worker);
  }

  return result;
}

export { simpleCull };
