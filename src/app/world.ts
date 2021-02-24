import { Engine } from '..';

class World {
  public engine: Engine;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  tick = () => {};
}

export { World };
