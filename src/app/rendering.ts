import { EventEmitter } from 'events';

import { Color, Scene, sRGBEncoding, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

import { Engine } from '../';
import { Sky } from '../libs';

type RenderingOptionsType = {
  fogColor: string;
  clearColor: string;
  directionalLightColor: string;
};

class Rendering extends EventEmitter {
  public engine: Engine;
  public scene: Scene;
  public renderer: WebGLRenderer;
  public composer: EffectComposer;
  public sky: Sky;

  public options: RenderingOptionsType;

  constructor(engine: Engine, options: RenderingOptionsType) {
    super();

    this.engine = engine;
    const { clearColor } = (this.options = options);

    // three.js scene
    this.scene = new Scene();

    // renderer
    this.renderer = new WebGLRenderer({
      canvas: this.engine.container.canvas,
    });
    this.renderer.setClearColor(new Color(clearColor));
    this.renderer.outputEncoding = sRGBEncoding;

    // composer
    this.composer = new EffectComposer(this.renderer);

    // sky
    this.sky = new Sky();
    this.scene.add(this.sky.mesh);

    engine.on('ready', () => {
      // add postprocessing
      this.composer.addPass(new RenderPass(this.scene, engine.camera.threeCamera));

      this.adjustRenderer();
    });
  }

  adjustRenderer = () => {
    const { width, height } = this.renderSize;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.composer.setSize(width, height);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  tick = () => {
    // this.sky.position.copy(this.engine.camera.controls.getObject().position);
  };

  render = () => {
    this.composer.render();
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
