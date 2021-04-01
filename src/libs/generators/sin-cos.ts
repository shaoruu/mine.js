import { Engine } from '../..';
import { Chunk } from '../../app';
import { Helper } from '../../utils';

import { Generator } from './generator';

import workerSrc from '!raw-loader!./workers/sin-cos.worker';

const DEFAULT_WORKER_COUNT = 20;
const workers: Worker[] = [];

for (let i = 0; i < DEFAULT_WORKER_COUNT; i++) {
  workers.push(Helper.loadWorker(workerSrc));
}

class SinCosGenerator extends Generator {
  constructor(engine: Engine) {
    super(engine);

    this.useBlockID('dirt');
    this.useBlockID('grass');
    this.useBlockID('stone');
  }

  async generate(chunk: Chunk) {
    const { voxels, minOuter, maxOuter, maxHeight } = chunk;
    const { stride } = voxels;

    const voxelsBuffer = (voxels.data as Uint8Array).buffer.slice(0);
    const worker = workers.pop() || Helper.loadWorker(workerSrc);

    const newVoxels = await new Promise((resolve) => {
      worker.postMessage(
        {
          data: voxelsBuffer,
          configs: {
            stride,
            maxHeight,
            types: {
              dirt: this.getBlockID('dirt'),
              grass: this.getBlockID('grass'),
              stone: this.getBlockID('stone'),
            },
            min: minOuter,
            max: maxOuter,
          },
        },
        [voxelsBuffer],
      );

      worker.onmessage = ({ data }) => {
        const { voxels, isEmpty } = data;
        chunk.isEmpty = isEmpty;
        resolve(new Uint8Array(voxels));
      };
    });

    // @ts-ignore
    chunk.voxels.data = newVoxels;

    if (workers.length < DEFAULT_WORKER_COUNT) {
      workers.push(worker);
    }
  }
}

export { SinCosGenerator };
