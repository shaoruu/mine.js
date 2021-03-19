import { Chunk } from '../../app';
import { Helper } from '../../utils';
import { MeshResultType } from '../types';

import workerSrc from '!raw-loader!./workers/simple-cull.worker';

const DEFAULT_WORKER_COUNT = 20;
const workers: Worker[] = [];

for (let i = 0; i < DEFAULT_WORKER_COUNT; i++) {
  workers.push(Helper.loadWorker(workerSrc));
}

async function simpleCull(chunk: Chunk): Promise<MeshResultType> {
  const {
    dimension,
    padding,
    lights,
    voxels,
    minInner,
    maxInner,
    engine: {
      registry: { cBlockDictionary, cMaterialUVDictionary },
    },
  } = chunk;
  const { stride } = voxels;

  const voxelsBuffer = (voxels.data as Int8Array).buffer.slice(0);
  const lightsBuffer = (lights.data as Int8Array).buffer.slice(0);
  const worker = workers.pop() || Helper.loadWorker(workerSrc);

  const result = await new Promise<MeshResultType>((resolve) => {
    worker.postMessage(
      {
        data: voxelsBuffer,
        lights: lightsBuffer,
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
      [voxelsBuffer, lightsBuffer],
    );

    worker.onmessage = ({ data }) => {
      const { positions, normals, indices, uvs, aos, lights } = data;
      resolve({
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        indices: new Float32Array(indices),
        uvs: new Float32Array(uvs),
        aos: new Float32Array(aos),
        lights: new Float32Array(lights),
      });
    };
  });

  //? DEBATABLE
  workers.push(worker);

  return result;
}

export { simpleCull };
