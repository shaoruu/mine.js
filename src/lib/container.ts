import Engine from '..';

import { EventEmitter } from 'events';
import createGameShell from 'game-shell';

export interface IContainerOptions {
  element: HTMLElement;
  domElement: HTMLElement;
  preventDefaults: boolean;
  pointerLock: boolean;

  /**
   * ms per tick - not ticks per second
   * @default 33
   */
  tickRate: number;
}

const containerDefaultOptions: IContainerOptions = {
  element: document.body,
  domElement: document.body,
  preventDefaults: true,
  pointerLock: true,
  tickRate: 33,
};

/**
 * @typicalname noa.container
 * @emits DOMready
 * @description Wraps `game-shell` module and manages HTML container, canvas, etc.
 */
export class Container extends EventEmitter {
  constructor(noa: Engine, options: Partial<IContainerOptions>) {
    super();

    const optionsWithDefaults = {
      ...containerDefaultOptions,
      ...options,
    };

    this._noa = noa;
    this._tickRate = optionsWithDefaults.tickRate;
    this.element = optionsWithDefaults.domElement || this.createContainerDiv();
    this.canvas = this.getOrCreateCanvas(this.element);
    this._shell = this.createShell(this.canvas, optionsWithDefaults);

    // mouse state/feature detection
    this.hasPointerLock = false;
    this.supportsPointerLock = false;
    this.pointerInGame = false;
    this.isFocused = document.hasFocus();

    // basic listeners
    const self = this;
    const lockChange = function (event: any) {
      self.onLockChange(event);
    };
    document.addEventListener('pointerlockchange', lockChange, false);
    document.addEventListener('mozpointerlockchange', lockChange, false);
    document.addEventListener('webkitpointerlockchange', lockChange, false);
    this.detectPointerLock();

    self.element.addEventListener('mouseenter', function () {
      self.pointerInGame = true;
    });
    self.element.addEventListener('mouseleave', function () {
      self.pointerInGame = false;
    });

    window.addEventListener('focus', function () {
      self.isFocused = true;
    });
    window.addEventListener('blur', function () {
      self.isFocused = false;
    });

    // get shell events after it's initialized
    this._shell.on('init', () => {
      // create shell listeners that drive engine functions
      const noa = self._noa;
      const shell = self._shell;
      shell.on('resize', noa.rendering.resize.bind(noa.rendering));

      // override shell's timing with simpler internal implementation
      this.setupTimingEvents();

      // let other components know DOM is ready
      self.emit('DOMready');
    });
  }

  _noa: Engine;
  _tickRate: number;
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  _shell: any;

  // mouse state/feature detection
  hasPointerLock: boolean;
  supportsPointerLock: boolean;
  pointerInGame: boolean;
  isFocused: boolean;

  appendTo = (htmlElement: HTMLElement) => {
    this.element.appendChild(htmlElement);
  };

  setPointerLock = (lock: boolean) => {
    // not sure if this will work robustly
    this._shell.pointerLock = !!lock;
  };

  /**
   * INTERNALS
   */
  createContainerDiv = () => {
    // based on github.com/mikolalysenko/game-shell - makeDefaultContainer()
    const container = document.createElement('div');
    container.tabIndex = 1;
    container.style.position = 'fixed';
    container.style.left = '0px';
    container.style.right = '0px';
    container.style.top = '0px';
    container.style.bottom = '0px';
    container.style.height = '100%';
    container.style.overflow = 'hidden';

    document.body.appendChild(container);
    document.body.style.overflow = 'hidden'; //Prevent bounce
    document.body.style.height = '100%';
    container.id = 'noa-container';

    return container;
  };

  createShell = (canvas: HTMLCanvasElement, options: Partial<IContainerOptions>) => {
    const shellDefaults: Partial<IContainerOptions> = {
      pointerLock: true,
      preventDefaults: false,
    };

    const optionsWithDefaults = {
      ...shellDefaults,
      ...options,
      element: canvas,
    };

    const shell = createGameShell(optionsWithDefaults);
    shell.preventDefaults = options.preventDefaults;

    return shell;
  };

  /**
   * set up stuff to detect pointer lock support.
   * Needlessly complex because Chrome/Android claims to support but doesn't.
   * For now, just feature detect, but assume no support if a touch event occurs
   * TODO: see if this makes sense on hybrid touch/mouse devices
   */
  detectPointerLock = () => {
    const lockElementExists =
      'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
    if (lockElementExists) {
      this.supportsPointerLock = true;
      const self = this;

      var listener = function (event: any) {
        self.supportsPointerLock = false;
        document.removeEventListener(event.type, listener);
      };
      document.addEventListener('touchmove', listener);
    }
  };

  /** track changes in Pointer Lock state */
  onLockChange = (event: any) => {
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

  getOrCreateCanvas = (element: HTMLElement) => {
    // based on github.com/stackgl/gl-now - default canvas
    let canvas = element.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.left = '0px';
      canvas.style.top = '0px';
      canvas.style.height = '100%';
      canvas.style.width = '100%';
      canvas.id = 'noa-canvas';
      element.insertBefore(canvas, element.firstChild);
    }

    return canvas;
  };

  setupTimingEvents = () => {
    const noa = this._noa;
    const tickRate = this._tickRate;
    let lastRAF = performance.now();
    let tickAccum = 0;
    const onAnimationFrame = function () {
      const t0 = performance.now();
      if (!noa._paused) {
        const dt = t0 - lastRAF;
        tickAccum += dt;
        // do at most two ticks per render
        let maxTicks = 2;
        while (tickAccum > tickRate && maxTicks-- > 0) {
          noa.tick();
          tickAccum -= tickRate;
        }
        // don't accrue deficit when running slow
        if (tickAccum > tickRate) tickAccum = 0;
        const t1 = performance.now();
        const renderPt = tickAccum + (t1 - t0);
        const framePart = Math.min(1, renderPt / tickRate);
        noa.render(framePart);
      }
      lastRAF = t0;
      requestAnimationFrame(onAnimationFrame);
    };
    requestAnimationFrame(onAnimationFrame);
  };
}
