import { Engine } from '..';

import * as dat from 'dat.gui';

class Debug {
  public engine: Engine;
  public gui: dat.GUI;

  constructor(engine: Engine) {
    this.engine = engine;
    this.gui = new dat.GUI();

    this.gui.add(this.engine.config, 'chunkSize', 8, 32, 1);
    this.gui.add(this.engine.config, 'dimension', 4, 32, 1);
  }
}

export { Debug };
