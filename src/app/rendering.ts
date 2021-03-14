import { EventEmitter } from 'events';

import { AmbientLight, Color, DirectionalLight, Scene, sRGBEncoding, WebGLRenderer } from 'three';

import { Engine } from '../';
import { Sky } from '../libs';

type RenderingOptionsType = {
  clearColor: string;
  directionalLightColor: string;
  directionalLightIntensity: number;
  directionalLightPosition: [number, number, number];
  ambientLightColor: string;
  ambientLightIntensity: number;
};

const defaultRenderingOptions: RenderingOptionsType = {
  clearColor: '#b6d2ff',
  directionalLightColor: '#ffffff',
  directionalLightIntensity: 0.5,
  directionalLightPosition: [300, 250, -500],
  ambientLightColor: '#ffffff',
  ambientLightIntensity: 0.3,
};

class Rendering extends EventEmitter {
  public engine: Engine;
  public scene: Scene;
  public renderer: WebGLRenderer;
  public directionalLight: DirectionalLight;
  public ambientLight: AmbientLight;
  public sky: Sky;

  public options: RenderingOptionsType;

  constructor(engine: Engine, options: Partial<RenderingOptionsType> = {}) {
    super();

    this.options = {
      ...defaultRenderingOptions,
      ...options,
    };

    const {
      clearColor,
      directionalLightColor,
      directionalLightIntensity,
      directionalLightPosition,
      ambientLightColor,
      ambientLightIntensity,
    } = this.options;

    this.engine = engine;

    // three.js scene
    this.scene = new Scene();

    // renderer
    this.renderer = new WebGLRenderer({
      canvas: this.engine.container.canvas,
    });
    this.renderer.setClearColor(new Color(clearColor));
    this.renderer.outputEncoding = sRGBEncoding;

    // directional light
    this.directionalLight = new DirectionalLight(directionalLightColor, directionalLightIntensity);
    this.directionalLight.position.set(...directionalLightPosition);
    this.scene.add(this.directionalLight);

    // ambient light
    this.ambientLight = new AmbientLight(ambientLightColor, ambientLightIntensity);
    this.scene.add(this.ambientLight);

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

export { Rendering };
