import { EventEmitter } from 'events';

import { Helper } from '../utils';

import { Engine } from './engine';

type ContainerOptionsType = {
  domElement?: HTMLElement;
  canvas?: HTMLCanvasElement;
};

class Container extends EventEmitter {
  public loading: HTMLDivElement;
  public domElement: HTMLElement = document.body;
  public canvas: HTMLCanvasElement;

  constructor(public engine: Engine, public options: ContainerOptionsType) {
    super();

    this.setupCanvas(options);

    engine.on('ready', () => {
      this.setupListeners();
    });
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
      bottom: '0px',
      right: '0px',
    });

    this.canvas = canvas;
    this.fitCanvas();

    this.domElement = domElement;
    this.domElement.append(this.canvas);
    this.domElement.id = 'mine.js-container';
  };

  setupListeners = () => {
    window.addEventListener('blur', () => {
      this.engine.emit('blur');
    });

    window.addEventListener('focus', () => {
      this.engine.emit('focus');
    });

    this.engine.inputs.bind('k', this.toggleFullScreen, '*');
  };

  toggleFullScreen = () => {
    const elem = document.body;
    if (
      (document.fullScreenElement !== undefined && document.fullScreenElement === null) ||
      (document.msFullscreenElement !== undefined && document.msFullscreenElement === null) ||
      (document.mozFullScreen !== undefined && !document.mozFullScreen) ||
      (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen)
    ) {
      if (elem.requestFullScreen) {
        elem.requestFullScreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullScreen) {
        // @ts-ignore
        elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.cancelFullScreen) {
        document.cancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  fitCanvas = () => {
    Helper.applyStyle(this.canvas, {
      width: '100vw',
      height: '100vh',
    });
  };
}

export { Container, ContainerOptionsType };
