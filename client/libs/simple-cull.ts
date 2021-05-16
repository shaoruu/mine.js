import ndarray from 'ndarray';

import { Coords3 } from '../../shared';
import { Helper } from '../utils';

import { MeshResultType } from './types';

import workerSrc from '!raw-loader!./workers/simple-cull.worker';

const DEFAULT_WORKER_COUNT = 20;
const workers: Worker[] = [];

type SimpleCullOptionsType = {
  min: Coords3;
  max: Coords3;
  realMin: Coords3;
  realMax: Coords3;
  dimensions: Coords3;
};

async function simpleCull(array: ndarray, options: SimpleCullOptionsType): Promise<MeshResultType> {
  const { stride, data } = array;
  const { dimensions, min, max, realMin, realMax } = options;

  const voxelsBuffer = (<Uint8Array>data).buffer.slice(0);
  const worker = workers.pop() || Helper.loadWorker(workerSrc);

  const result = await new Promise<MeshResultType>((resolve) => {
    worker.postMessage(
      {
        data: voxelsBuffer,
        configs: {
          min,
          max,
          realMin,
          realMax,
          dimensions,
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

  //? DEBATABLE
  if (workers.length < DEFAULT_WORKER_COUNT) {
    workers.push(worker);
  }

  return result;
}

export { simpleCull };
