import { EventEmitter } from 'events';

import { Helper } from '../utils';

import { Engine } from './engine';

type ContainerOptionsType = {
  domElement?: HTMLElement;
  canvas?: HTMLCanvasElement;
};

class Container extends EventEmitter {
  public domElement: HTMLElement = document.body;
  public canvas: HTMLCanvasElement;

  constructor(public engine: Engine, public options: ContainerOptionsType) {
    super();

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

export { Container, ContainerOptionsType };
