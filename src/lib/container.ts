import { Engine } from '..';

import createShell from 'game-shell';

type ContainerOptions = {
  domElement?: HTMLElement;
};

class Container {
  private shell: unknown;

  engine: Engine;
  element: HTMLElement;
  canvas: HTMLCanvasElement;

  hasPointerLock = false;
  supportsPointerLock = false;
  pointerInGame = false;
  isFocused = document.hasFocus();

  constructor(engine: Engine, opts: ContainerOptions = {}) {
    this.engine = engine;
    this.element = opts.domElement;
    this.canvas = this.getOrCreateCanvas(this.element);
    this.shell = createShell(this.canvas, opts);

    // basic listeners
  }

  getOrCreateCanvas = (element: HTMLElement | undefined) => {
    let canvas = element.querySelector('canvas');

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.left = '0px';
      canvas.style.top = '0px';
      canvas.style.height = '100%';
      canvas.style.width = '100%';
      canvas.id = 'minejs-canvas';
    }

    return canvas;
  };

  lockChange = () => {
    const el = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement;
    if (el) {
      this.hasPointerLock = true;
      this.emit('gainedPointerLock');
    } else {
      this.hasPointerLock = false;
      this.emit('lostPointerLock');
    }
    // this works around a Firefox bug where no mouse-in event
    // gets issued after starting pointerlock
    if (el) {
      // act as if pointer is in game window while pointerLock is true
      this.pointerInGame = true;
    }
  };
}

export default (engine: Engine, opts: ContainerOptions): Container => {
  return new Container(engine, opts);
};
