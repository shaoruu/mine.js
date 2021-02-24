import { Engine } from '../';

import skyVertexShader from './shaders/sky/vertex.glsl';
import skyFragmentShader from './shaders/sky/fragment.glsl';

import { EventEmitter } from 'events';
import {
  BackSide,
  BoxBufferGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  sRGBEncoding,
  WebGLRenderer,
} from 'three';
import { GUI } from 'dat.gui';

type RenderingOptionsType = {
  clearColor: string;
  lightColor: string;
  topColor: string;
  bottomColor: string;
  lightIntensity: number;
  lightPosition: [number, number, number];
  skyDomeOffset: number;
};

const defaultRenderingOptions: RenderingOptionsType = {
  clearColor: '#b6d2ff',
  lightColor: '#aabbff',
  topColor: '#0077ff',
  bottomColor: '#eeeeee',
  lightIntensity: 0.3,
  lightPosition: [300, 250, -500],
  skyDomeOffset: 600,
};

class Rendering extends EventEmitter {
  public engine: Engine;
  public scene: Scene;
  public renderer: WebGLRenderer;
  public light: DirectionalLight;
  public sky: Mesh;

  public options: RenderingOptionsType;
  public datGUI: GUI;

  constructor(engine: Engine, options: Partial<RenderingOptionsType> = {}) {
    super();

    this.options = {
      ...options,
      ...defaultRenderingOptions,
    };

    const {
      clearColor,
      lightColor,
      lightIntensity,
      lightPosition,
      topColor,
      bottomColor,
      skyDomeOffset,
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

    // lights
    this.light = new DirectionalLight(lightColor, lightIntensity);
    this.light.position.set(...lightPosition);
    this.scene.add(this.light);

    // sky
    const uniforms = {
      topColor: { value: new Color(topColor) },
      bottomColor: { value: new Color(bottomColor) },
      offset: { value: skyDomeOffset },
      exponent: { value: 0.6 },
    };
    uniforms.topColor.value.copy(this.light.color);

    const skyGeo = new SphereGeometry(4000, 32, 15);
    const skyMat = new ShaderMaterial({
      uniforms: uniforms,
      vertexShader: skyVertexShader,
      fragmentShader: skyFragmentShader,
      side: BackSide,
    });

    this.sky = new Mesh(skyGeo, skyMat);
    this.scene.add(this.sky);

    this.adjustRenderer();
    this.debug();
    this.test();
  }

  adjustRenderer = () => {
    const { width, height } = this.renderSize;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  tick = () => {
    this.sky.position.copy(this.engine.camera.controls.getObject().position);
  };

  render = () => {
    this.renderer.render(this.scene, this.engine.camera.threeCamera);
  };

  debug = () => {
    this.datGUI = this.engine.debug.gui.addFolder('rendering');

    this.datGUI
      .add(this.options, 'skyDomeOffset', 200, 2000, 10)
      // @ts-ignore
      .onChange((value) => (this.sky.material.uniforms.offset.value = value));

    this.datGUI
      .addColor(this.options, 'topColor')
      // @ts-ignore
      .onFinishChange((value) => this.sky.material.uniforms.topColor.value.set(value));
    this.datGUI
      .addColor(this.options, 'bottomColor')
      // @ts-ignore
      .onFinishChange((value) => this.sky.material.uniforms.bottomColor.value.set(value));
    this.datGUI.addColor(this.options, 'clearColor').onFinishChange((value) => this.renderer.setClearColor(value));
    this.datGUI.addColor(this.options, 'lightColor').onFinishChange((value) => this.light.color.set(value));

    this.datGUI.open();
  };

  test = () => {
    const material = new MeshBasicMaterial({
      color: 'blue',
    });
    const geometry = new BoxBufferGeometry(0.5, 0.5, 0.5);
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 10 - 5;
      const y = Math.random() * 10 - 5;
      const z = Math.random() * 10 - 5;

      const mesh = new Mesh(geometry, material);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);
    }
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
