import { GUI } from 'dat.gui';
import Stats from 'stats.js';
import { AxesHelper, GridHelper } from 'three';

import { Engine } from '..';

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

    engine.on('ready', () => {
      this.mount();

      const {
        rendering: { scene },
        world: {
          options: { chunkSize, dimension },
        },
      } = this.engine;

      const axesHelper = new AxesHelper(5);
      engine.rendering.scene.add(axesHelper);

      const gridHelper = new GridHelper(2 * chunkSize * dimension, 2 * chunkSize);
      scene.add(gridHelper);
    });
  }

  mount = () => {
    this.engine.container.domElement.appendChild(this.stats.dom);
  };
}

export { Debug };
