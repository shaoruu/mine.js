import { Engine } from '../';

import skyVertexShader from './shaders/sky/vertex.glsl';
import skyFragmentShader from './shaders/sky/fragment.glsl';

import { EventEmitter } from 'events';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BackSide,
  BoxBufferGeometry,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  Scene,
  ShaderMaterial,
  sRGBEncoding,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GUI } from 'dat.gui';

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
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  inclination: number; // elevation / inclination
  azimuth: number; // Facing front,
  exposure: number;
};

const defaultRenderingOptions: RenderingOptionsType = {
  clearColor: '#b6d2ff',
  topColor: '#aabbff',
  bottomColor: '#eeeeee',
  directionalLightColor: '#ffffff',
  directionalLightIntensity: 0.5,
  directionalLightPosition: [300, 250, -500],
  ambientLightColor: '#ffffff',
  ambientLightIntensity: 0.3,
  skyDomeOffset: 800,
  turbidity: 3,
  rayleigh: 1,
  mieCoefficient: 0.003,
  mieDirectionalG: 0.7,
  inclination: 0.49, // elevation / inclination
  azimuth: 0.25, // Facing front,
  exposure: 0.5,
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

  public sun = new Vector3();

  constructor(engine: Engine, options: Partial<RenderingOptionsType> = {}) {
    super();

    this.options = {
      ...options,
      ...defaultRenderingOptions,
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
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.5;

    // directional light
    this.directionalLight = new DirectionalLight(directionalLightColor, directionalLightIntensity);
    this.directionalLight.position.set(...directionalLightPosition);
    this.scene.add(this.directionalLight);

    // ambient light
    this.ambientLight = new AmbientLight(ambientLightColor, ambientLightIntensity);
    this.scene.add(this.ambientLight);

    const skyMaterial = new ShaderMaterial({
      name: 'SkyShader',
      uniforms: {
        turbidity: { value: 2 },
        rayleigh: { value: 1 },
        mieCoefficient: { value: 0.005 },
        mieDirectionalG: { value: 0.8 },
        sunPosition: { value: new Vector3() },
        up: { value: new Vector3(0, 1, 0) },
      },
      vertexShader: skyVertexShader,
      fragmentShader: skyFragmentShader,
      side: BackSide,
      depthWrite: false,
    });
    const skyGeometry = new BoxGeometry();
    this.sky = new Mesh(skyGeometry, skyMaterial);
    this.sky.scale.setScalar(450000);
    this.scene.add(this.sky);
    this.skyGUIChanged();

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

    this.datGUI.add(this.options, 'turbidity', 0.0, 20.0, 0.1).onChange(this.skyGUIChanged);
    this.datGUI.add(this.options, 'rayleigh', 0.0, 4, 0.001).onChange(this.skyGUIChanged);
    this.datGUI.add(this.options, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(this.skyGUIChanged);
    this.datGUI.add(this.options, 'mieDirectionalG', 0.0, 1, 0.001).onChange(this.skyGUIChanged);
    this.datGUI.add(this.options, 'inclination', 0, 1, 0.0001).onChange(this.skyGUIChanged);
    this.datGUI.add(this.options, 'azimuth', 0, 1, 0.0001).onChange(this.skyGUIChanged);
    this.datGUI.add(this.options, 'exposure', 0, 1, 0.0001).onChange(this.skyGUIChanged);

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

  skyGUIChanged = () => {
    const { uniforms } = this.sky.material as ShaderMaterial;
    uniforms['turbidity'].value = this.options.turbidity;
    uniforms['rayleigh'].value = this.options.rayleigh;
    uniforms['mieCoefficient'].value = this.options.mieCoefficient;
    uniforms['mieDirectionalG'].value = this.options.mieDirectionalG;

    const theta = Math.PI * (this.options.inclination - 0.5);
    const phi = 2 * Math.PI * (this.options.azimuth - 0.5);

    this.sun.x = Math.cos(phi);
    this.sun.y = Math.sin(phi) * Math.sin(theta);
    this.sun.z = Math.sin(phi) * Math.cos(theta);

    this.directionalLight.position.copy(this.sun);
    const intensity = (1 - this.options.inclination) * 0.5;
    this.ambientLight.intensity = intensity;
    this.directionalLight.intensity = intensity;

    uniforms['sunPosition'].value.copy(this.sun);

    this.renderer.toneMappingExposure = this.options.exposure;
  };

  test = () => {
    const { material } = this.engine.registry.getMaterial('dirt');
    const geometry = new BoxBufferGeometry(0.5, 0.5, 0.5);
    for (let i = 0; i < 50; i++) {
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
