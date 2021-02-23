import { Engine } from '..';
import { Helper } from '../utils';

import { EventEmitter } from 'events';
import { Vector2 } from 'three';

type ContainerOptions = {
  container: HTMLElement;
  canvas?: HTMLCanvasElement;
  pointerLock: boolean;
  preventDefault: boolean;
};

const defaultContainerOptions: ContainerOptions = {
  container: document.body,
  canvas: undefined,
  pointerLock: true,
  preventDefault: true,
};

class Container extends EventEmitter {
  public engine: Engine;
  public container: HTMLElement = document.body;
  public canvas: HTMLCanvasElement;

  public movements = new Vector2();
  public pointerLocked = false;

  constructor(engine: Engine, options: Partial<ContainerOptions>) {
    super();

    options = {
      ...options,
      ...defaultContainerOptions,
    };

    this.engine = engine;

    this.setupCanvas(options);
  }

  setupCanvas = (options: Partial<ContainerOptions>) => {
    const { canvas, container = document.body } = options;

    if (canvas) {
      this.canvas = canvas;
    } else {
      const newCanvas = document.createElement('canvas');

      Helper.applyStyle(newCanvas, {
        height: '100%',
        left: '0',
        margin: '0',
        outline: 'none',
        padding: '0',
        position: 'fixed',
        top: '0',
        width: '100%',
        zIndex: '1000000',
      });

      this.canvas = newCanvas;
    }

    this.container = container;
    this.container.append(this.canvas);
    this.container.id = 'mine.js-container';

    // Pointerlock
    document.addEventListener('pointerlockchange', this.onLockChange, false);
    document.addEventListener('mozpointerlockchange', this.onLockChange, false);

    // TODO: extract this.
    this.canvas.onclick = () => {
      if (!this.pointerLocked) {
        this.canvas.requestPointerLock();
      }
    };
  };

  onLockChange = () => {
    if (document.pointerLockElement === this.canvas) {
      this.pointerLocked = true;
      document.addEventListener('mousemove', this.updateMovements, false);
    } else {
      this.pointerLocked = false;
      document.removeEventListener('mousemove', this.updateMovements, false);
    }
  };

  updateMovements = (e: MouseEvent) => {
    const { movementX, movementY } = e;
    this.movements.set(movementX, movementY);
  };
}

export { Container };
