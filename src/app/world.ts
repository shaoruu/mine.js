import { Engine } from '..';

import { EventEmitter } from 'events';

type WorldOptionsType = {
  chunkSize: number;
  dimension: number;
};

const defaultWorldOptions: WorldOptionsType = {
  chunkSize: 32,
  dimension: 16,
};

class World extends EventEmitter {
  public engine: Engine;
  public options: WorldOptionsType;

  constructor(engine: Engine, options: Partial<WorldOptionsType> = {}) {
    super();

    this.options = {
      ...options,
      ...defaultWorldOptions,
    };

    this.engine = engine;
  }

  tick = () => {};
}

export { World };
