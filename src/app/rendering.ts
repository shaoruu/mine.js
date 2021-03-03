import { EventEmitter } from 'events';

import { GUI } from 'dat.gui';
import {
  AmbientLight,
  BackSide,
  BoxBufferGeometry,
  Color,
  DirectionalLight,
  Mesh,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  sRGBEncoding,
  WebGLRenderer,
} from 'three';

import { Engine } from '../';

import skyFragmentShader from './shaders/sky/fragment.glsl';
import skyVertexShader from './shaders/sky/vertex.glsl';

type RenderingOptionsType = {
  clearColor: string;
  topColor: string;
  bottomColor: string;
  directionalLightColor: string;
  directionalLightIntensity: number;
  directionalLightPosition: [number, number, number];
  ambientLightColor: string;
  ambientLightIntensity: number;
  skyDomeOffset: number;
};

const defaultRenderingOptions: RenderingOptionsType = {
  clearColor: '#b6d2ff',
  topColor: '#74B3FF',
  bottomColor: '#eeeeee',
  directionalLightColor: '#ffffff',
  directionalLightIntensity: 0.5,
  directionalLightPosition: [300, 250, -500],
  ambientLightColor: '#ffffff',
  ambientLightIntensity: 0.3,
  skyDomeOffset: 600,
};

class Rendering extends EventEmitter {
  public engine: Engine;
  public scene: Scene;
  public renderer: WebGLRenderer;
  public directionalLight: DirectionalLight;
  public ambientLight: AmbientLight;
  public sky: Mesh;

  public options: RenderingOptionsType;
  public datGUI: GUI;

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

    // directional light
    this.directionalLight = new DirectionalLight(directionalLightColor, directionalLightIntensity);
    this.directionalLight.position.set(...directionalLightPosition);
    this.scene.add(this.directionalLight);

    // ambient light
    this.ambientLight = new AmbientLight(ambientLightColor, ambientLightIntensity);
    this.scene.add(this.ambientLight);

    // sky
    const uniforms = {
      topColor: { value: new Color(topColor) },
      bottomColor: { value: new Color(bottomColor) },
      offset: { value: skyDomeOffset },
      exponent: { value: 0.6 },
    };

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
    this.datGUI
      .addColor(this.options, 'directionalLightColor')
      .onFinishChange((value) => this.directionalLight.color.set(value));
    this.datGUI
      .addColor(this.options, 'ambientLightColor')
      .onFinishChange((value) => this.ambientLight.color.set(value));

    this.datGUI.open();
  };

  test = () => {
    const material = this.engine.registry.getMaterial('dirt');
    const geometry = new BoxBufferGeometry(1, 1, 1);
    for (let i = 0; i < 50; i++) {
      const x = ((Math.random() * 10) | 0) - 5 + 0.5;
      const y = ((Math.random() * 10) | 0) + 0.5;
      const z = ((Math.random() * 10) | 0) - 5 + 0.5;

      const mesh = new Mesh(geometry, material || undefined);
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
