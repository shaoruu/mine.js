import { Engine } from '../';

import { EventEmitter } from 'events';
import { Scene, WebGLRenderer } from 'three';

type RenderingOptions = {
  test?: number;
};

const defaultRenderingOptions: RenderingOptions = {
  test: 123,
};

class Rendering extends EventEmitter {
  public engine: Engine;
  public scene: Scene;
  public renderer: WebGLRenderer;

  constructor(engine: Engine, options: Partial<RenderingOptions> = {}) {
    super();

    const {} = {
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
    this.adjustRenderer();
  }

  adjustRenderer = () => {
    const { width, height } = this.renderSize;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
