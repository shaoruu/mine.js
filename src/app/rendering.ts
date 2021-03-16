import { EventEmitter } from 'events';

import { Color, Scene, sRGBEncoding, WebGLRenderer } from 'three';

import { Engine } from '../';
import { Sky } from '../libs';

type RenderingOptionsType = {
  clearColor: string;
  directionalLightColor: string;
};

const defaultRenderingOptions: RenderingOptionsType = {
  clearColor: '#b6d2ff',
  directionalLightColor: '#ffffff',
};

class Rendering extends EventEmitter {
  public engine: Engine;
  public scene: Scene;
  public renderer: WebGLRenderer;
  public sky: Sky;

  public options: RenderingOptionsType;

  constructor(engine: Engine, options: Partial<RenderingOptionsType> = {}) {
    super();

    this.options = {
      ...defaultRenderingOptions,
      ...options,
    };

    const { clearColor } = this.options;

    this.engine = engine;

    // three.js scene
    this.scene = new Scene();

    // renderer
    this.renderer = new WebGLRenderer({
      canvas: this.engine.container.canvas,
    });
    this.renderer.setClearColor(new Color(clearColor));
    this.renderer.outputEncoding = sRGBEncoding;

    // sky
    this.sky = new Sky();
    this.scene.add(this.sky.mesh);

    this.adjustRenderer();
  }

  adjustRenderer = () => {
    const { width, height } = this.renderSize;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  tick = () => {
    // this.sky.position.copy(this.engine.camera.controls.getObject().position);
  };

  render = () => {
    this.renderer.render(this.scene, this.engine.camera.threeCamera);
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

export { Rendering, RenderingOptionsType };
