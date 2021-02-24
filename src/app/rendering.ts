import { Engine } from '../';

import { EventEmitter } from 'events';
import { Color, Scene, WebGLRenderer } from 'three';
import { GUI } from 'dat.gui';

type RenderingOptions = {
  clearColor: string;
};

const defaultRenderingOptions: RenderingOptions = {
  clearColor: '#b6d2ff',
};

class Rendering extends EventEmitter {
  public engine: Engine;
  public scene: Scene;
  public renderer: WebGLRenderer;

  public options: RenderingOptions;
  public datGUI: GUI;

  constructor(engine: Engine, options: Partial<RenderingOptions> = {}) {
    super();

    this.options = {
      ...options,
      ...defaultRenderingOptions,
    };

    this.engine = engine;

    // three.js scene
    this.scene = new Scene();

    // renderer
    this.renderer = new WebGLRenderer({
      canvas: this.engine.container.canvas,
    });
    this.renderer.setClearColor(new Color(this.options.clearColor));

    this.adjustRenderer();
    this.debug();
  }

  adjustRenderer = () => {
    const { width, height } = this.renderSize;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  render = () => {
    this.renderer.render(this.scene, this.engine.camera.threeCamera);
  };

  debug = () => {
    this.datGUI = this.engine.debug.gui.addFolder('rendering');

    this.datGUI.addColor(this.options, 'clearColor').onFinishChange((value) => {
      this.renderer.setClearColor(value);
    });
  };

  get renderSize() {
    const { offsetWidth, offsetHeight } = this.engine.container.canvas;
    return { width: offsetWidth, height: offsetHeight };
  }

  get aspectRatio() {
    const { width, height } = this.renderSize;
    return width / height;
  }
}

export { Rendering };
