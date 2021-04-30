import { EventEmitter } from 'events';

import {
  Color,
  DepthFormat,
  DepthTexture,
  FloatType,
  LinearFilter,
  RGBAFormat,
  Scene,
  sRGBEncoding,
  UnsignedIntType,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';

import { Engine } from './engine';

type RenderingOptionsType = {
  fogColor: string;
  fogNearColor: string;
  clearColor: string;
};

class Rendering extends EventEmitter {
  public scene: Scene;
  public renderer: WebGLRenderer;
  public composer: EffectComposer;
  public fxaa: ShaderPass;
  public noColorMateria;
  public fogUniforms: { [key: string]: { value: number | Color } };

  constructor(public engine: Engine, public options: RenderingOptionsType) {
    super();

    const { fogColor, fogNearColor, clearColor } = options;

    // three.js scene
    this.scene = new Scene();

    // renderer
    this.renderer = new WebGLRenderer({
      powerPreference: 'high-performance',
      stencil: false,
      depth: false,
      canvas: this.engine.container.canvas,
    });
    this.renderer.setClearColor(new Color(clearColor));
    this.renderer.outputEncoding = sRGBEncoding;

    // composer
    const { width, height } = this.renderSize;
    const renderTarget = new WebGLRenderTarget(width, height, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: FloatType,
    });
    renderTarget.stencilBuffer = false;
    renderTarget.depthBuffer = true;
    // @ts-ignore
    renderTarget.depthTexture = new DepthTexture();
    renderTarget.depthTexture.format = DepthFormat;
    renderTarget.depthTexture.type = UnsignedIntType;

    this.composer = new EffectComposer(this.renderer, renderTarget);

    // fog
    const { renderRadius, chunkSize, dimension } = this.engine.config.world;
    this.fogUniforms = {
      uFogColor: { value: new Color(fogColor) },
      uFogNearColor: { value: new Color(fogNearColor) },
      uFogNear: { value: renderRadius * 0.5 * chunkSize * dimension },
      uFogFar: { value: renderRadius * chunkSize * dimension },
    };

    engine.on('ready', () => {
      // add postprocessing

      this.fxaa = new ShaderPass(FXAAShader);

      this.composer.addPass(new RenderPass(this.scene, engine.camera.threeCamera));
      this.composer.addPass(this.fxaa);
      // this.composer.addPass(new ShaderPass());

      this.adjustRenderer();
    });
  }

  adjustRenderer = () => {
    const { width, height } = this.renderSize;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);

    this.composer.setSize(width, height);
    this.composer.setPixelRatio(pixelRatio);

    this.fxaa.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
    this.fxaa.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);
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
