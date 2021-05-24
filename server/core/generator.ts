import { spawn, Pool, Worker, Transfer } from 'threads';

import { TypeMap } from '../../shared';
import { GeneratorTypes } from '../libs';

import type { Generator as GeneratorType } from './workers/generators';

import { Chunk, Mine } from '.';

class Generator {
  static pool = Pool(
    () => spawn<GeneratorType>(new Worker('./workers/generators'), { timeout: 30000 }),
    { concurrency: 2, size: 16 },
  );

  static generate = async (chunk: Chunk, type: GeneratorTypes) => {
    let types: TypeMap;

    switch (type) {
      case 'flat':
        types = Mine.registry.getTypeMap(['air', 'dirt', 'grass-block', 'stone']);
        break;
      case 'hilly':
        types = Mine.registry.getTypeMap([
          'dirt',
          'grass-block',
          'stone',
          'yellow',
          'snow',
          'green',
          'blue',
          'trunk',
          'leaves',
          'sand',
          'greysand',
          'greystone',
        ]);
        break;
      case 'sin-cos':
        types = Mine.registry.getTypeMap(['air', 'dirt', 'stone', 'grass-block']);
        break;
    }

    const { voxels, min, max } = chunk;

    const { isEmpty, buffer } = await new Promise((resolve) => {
      Generator.pool.queue(async (generator) => {
        const result = generator.generate(
          Transfer((<Uint8Array>voxels.data).buffer.slice(0)),
          min,
          max,
          type,
          types,
          chunk.options,
        );

        resolve(result);
      });
    });

    chunk.isEmpty = isEmpty;
    chunk.voxels.data = new Uint8Array(buffer);
  };
}

export { Generator };
