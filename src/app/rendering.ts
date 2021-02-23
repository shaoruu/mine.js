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
    const { canvas } = engine.container;
    const { offsetWidth, offsetHeight } = canvas;
    this.renderer = new WebGLRenderer({
      canvas,
    });
    this.renderer.setSize(offsetWidth, offsetHeight);
  }
}

export { Rendering };
