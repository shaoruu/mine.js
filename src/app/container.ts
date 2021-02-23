import { Engine } from '..';
import { Helper } from '../utils';

import { EventEmitter } from 'events';
import { Vector2 } from 'three';

type ContainerOptions = {
  domElement: HTMLElement;
  canvas?: HTMLCanvasElement;
  pointerLock: boolean;
  preventDefault: boolean;
};

const defaultContainerOptions: ContainerOptions = {
  domElement: document.body,
  canvas: undefined,
  pointerLock: true,
  preventDefault: true,
};

class Container extends EventEmitter {
  public engine: Engine;
  public domElement: HTMLElement = document.body;
  public canvas: HTMLCanvasElement;

  public movements = new Vector2();
  public pointerLocked = false;

  constructor(engine: Engine, options: Partial<ContainerOptions> = {}) {
    super();

    options = {
      ...options,
      ...defaultContainerOptions,
    };

    this.engine = engine;

    this.setupCanvas(options);
  }

  setupCanvas = (options: Partial<ContainerOptions>) => {
    const { canvas, domElement = document.body } = options;

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
      });

      this.canvas = newCanvas;
    }

    this.domElement = domElement;
    this.domElement.append(this.canvas);
    this.domElement.id = 'mine.js-container';

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
