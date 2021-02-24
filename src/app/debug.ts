import { Engine } from '..';

import { GUI } from 'dat.gui';
import Stats from 'stats.js';

class Debug {
  public engine: Engine;
  public gui: dat.GUI;
  public stats: Stats;

  constructor(engine: Engine) {
    this.engine = engine;

    this.gui = new GUI();

    this.stats = new Stats();

    const { parentElement } = this.gui.domElement;
    if (parentElement) parentElement.style.zIndex = '10000000';
  }

  mount = () => {
    this.engine.container.domElement.appendChild(this.stats.dom);
  };
}

export { Debug };
