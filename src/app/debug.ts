import { Engine } from '..';

import * as dat from 'dat.gui';

class Debug {
  public engine: Engine;
  public gui: dat.GUI;

  constructor(engine: Engine) {
    this.engine = engine;
    this.gui = new dat.GUI();

    this.register(this.engine.config, 'chunkSize', 8, 32, 1);
    this.register(this.engine.config, 'dimension', 4, 32, 1);
    const { parentElement } = this.gui.domElement;
    if (parentElement) parentElement.style.zIndex = '10000000';
  }

  register = (object: any, property: string, min: number, max: number, step: number, onFinish = () => {}) => {
    this.gui.add(object, property, min, max, step).onFinishChange(onFinish);
  };
}

export { Debug };
