import { Engine } from '..';

import createGameShell from 'game-shell';
import { EventEmitter } from 'events';

type ContainerOptions = {
  element: HTMLElement;
  domElement: HTMLElement;
  preventDefaults: boolean;
  pointerLock: boolean;
  tickRate: number;
};

const containerDefaultOptions: ContainerOptions = {
  element: document.body,
  domElement: document.body,
  preventDefaults: true,
  pointerLock: true,
  tickRate: 33,
};

class Container extends EventEmitter {
  private tickRate: number;
  private shell: any;

  engine: Engine;
  element: HTMLElement;
  canvas: HTMLCanvasElement;

  hasPointerLock = false;
  supportsPointerLock = false;
  pointerInGame = false;
  isFocused = document.hasFocus();

  constructor(engine: Engine, opts: Partial<ContainerOptions>) {
    super();

    opts = {
      ...containerDefaultOptions,
      ...opts,
    };

    this.engine = engine;
    this.element = opts.domElement;
    this.tickRate = opts.tickRate;
    this.canvas = this.getOrCreateCanvas(this.element);
    this.shell = this.createShell(this.canvas, opts);

    // basic listeners
    document.addEventListener('pointerlockchange', this.lockChange, false);
    document.addEventListener('mozpointerlockchange', this.lockChange, false);
    document.addEventListener('webkitpointerlockchange', this.lockChange, false);
    this.detectPointerLock();

    this.element.addEventListener('mouseenter', () => {
      this.pointerInGame = true;
    });
    this.element.addEventListener('mouseleave', () => {
      this.pointerInGame = false;
    });

    window.addEventListener('focus', () => {
      this.isFocused = true;
    });
    window.addEventListener('blur', () => {
      this.isFocused = false;
    });

    this.shell.on('init', () => {
      const { shell } = this;

      // TODO
      shell.on('resize');
      this.setupTimingEvents();
      this.emit('DOMready');
    });
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

  createShell = (canvas: HTMLCanvasElement, opts: Partial<ContainerOptions>) => {
    const shellDefaults = {
      pointerLock: true,
      preventDefaults: false,
    };

    opts = { ...shellDefaults, ...opts };
    opts.element = canvas;
    const shell = createGameShell(opts);
    shell.preventDefaults = opts.preventDefaults;

    return shell;
  };

  lockChange = () => {
    const el =
      document.pointerLockElement ||
      (document as any).mozPointerLockElement ||
      (document as any).webkitPointerLockElement;
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

  detectPointerLock = () => {
    const lockElementExists =
      'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
    if (lockElementExists) {
      this.supportsPointerLock = true;

      const listener = (event: any) => {
        this.supportsPointerLock = false;
        document.removeEventListener(event.type, listener);
      };
      document.addEventListener('touchmove', listener);
    }
  };

  appendTo = (htmlElement: HTMLElement) => {
    this.element.appendChild(htmlElement);
  };

  setPointerLock = (lock: any) => {
    this.shell.pointerlock = !!lock;
  };

  setupTimingEvents = () => {
    const { engine, tickRate } = this;

    let lastRAF = performance.now();
    let tickAccum = 0;

    const onAnimationFrame = function () {
      const t0 = performance.now();

      if (!engine.paused) {
        const dt = t0 - lastRAF;
        tickAccum += dt;

        // do at most two ticks per render
        let maxTicks = 2;
        while (tickAccum > tickRate && maxTicks-- > 0) {
          engine.tick();
          tickAccum -= tickRate;
        }

        // don't accrue deficit when running slow
        if (tickAccum > tickRate) tickAccum = 0;

        const t1 = performance.now();
        const renderPt = tickAccum + (t1 - t0);
        const framePart = Math.min(1, renderPt / tickRate);

        engine.render(framePart);
      }

      lastRAF = t0;

      requestAnimationFrame(onAnimationFrame);
    };
    requestAnimationFrame(onAnimationFrame);
  };
}

export default Container;
