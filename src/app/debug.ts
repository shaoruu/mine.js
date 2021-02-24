import { Engine } from '..';

import { GUI } from 'dat.gui';

class Debug {
  public engine: Engine;
  public gui: dat.GUI;

  constructor(engine: Engine) {
    this.engine = engine;
    this.gui = new GUI();

    // testing options
    // this.gui.add(this.engine.config, 'chunkSize', 8, 32, 1);
    // this.gui.add(this.engine.config, 'dimension', 4, 32, 1);

    const { parentElement } = this.gui.domElement;
    if (parentElement) parentElement.style.zIndex = '10000000';
  }
}

export { Debug };
