import { EventEmitter } from 'events';

import { Engine } from '..';
import { Helper } from '../utils';

type ContainerOptionsType = {
  domElement: HTMLElement;
  canvas?: HTMLCanvasElement;
};

const defaultContainerOptions: ContainerOptionsType = {
  domElement: document.body,
  canvas: undefined,
};

class Container extends EventEmitter {
  public engine: Engine;
  public domElement: HTMLElement = document.body;
  public canvas: HTMLCanvasElement;

  constructor(engine: Engine, options: Partial<ContainerOptionsType> = {}) {
    super();

    options = {
      ...defaultContainerOptions,
      ...options,
    };

    this.engine = engine;

    this.setupCanvas(options);
  }

  setupCanvas = (options: Partial<ContainerOptionsType>) => {
    const { canvas = document.createElement('canvas'), domElement = document.body } = options;

    Helper.applyStyle(canvas, {
      position: 'absolute',
      margin: '0',
      outline: 'none',
      padding: '0',
      top: '0px',
      left: '0px',
    });

    this.canvas = canvas;
    this.fitCanvas();

    this.domElement = domElement;
    this.domElement.append(this.canvas);
    this.domElement.id = 'mine.js-container';
  };

  fitCanvas = () => {
    this.canvas.style.width = `${this.domElement.clientWidth}px`;
    this.canvas.style.height = `${this.domElement.clientHeight}px`;
  };
}

export { Container };
