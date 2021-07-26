import { EventEmitter } from 'events';

import {
  Color,
  DepthFormat,
  DepthTexture,
  FloatType,
  GammaEncoding,
  LinearFilter,
  LogLuvEncoding,
  RGBADepthPacking,
  RGBAFormat,
  RGBDEncoding,
  Scene,
  UnsignedIntType,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { sRGBEncoding } from 'three';
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
  public renderTarget: WebGLRenderTarget;
  public fxaa: ShaderPass;
  public fogNearColor: Color;
  public fogFarColor: Color;
  public fogUniforms: { [key: string]: { value: number | Color } };

  constructor(public engine: Engine, public options: RenderingOptionsType) {
    super();

    const { fogColor, fogNearColor, clearColor } = options;

    // three.js scene
    this.scene = new Scene();

    const canvas = this.engine.container.canvas;
    let context: WebGLRenderingContext | WebGL2RenderingContext;
    try {
      if (window.WebGL2RenderingContext) {
        context = canvas.getContext('webgl2');
      }
    } catch (e) {
      context = canvas.getContext('webgl');
    }

    // renderer
    this.renderer = new WebGLRenderer({
      powerPreference: 'high-performance',
      stencil: false,
      depth: false,
      context,
      canvas,
    });
    this.renderer.setClearColor(new Color(clearColor));
    this.renderer.sortObjects = true;
    this.renderer.extensions.get('EXT_color_buffer_float');

    // composer
    const { width, height } = this.renderSize;
    this.renderTarget = new WebGLRenderTarget(width, height, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: FloatType,
    });
    this.renderTarget.stencilBuffer = false;
    this.renderTarget.depthBuffer = true;
    this.renderTarget.texture.encoding = GammaEncoding;
    // @ts-ignore
    this.renderTarget.depthTexture = new DepthTexture();
    this.renderTarget.depthTexture.format = DepthFormat;
    this.renderTarget.depthTexture.type = UnsignedIntType;

    this.composer = new EffectComposer(this.renderer, this.renderTarget);

    // fog
    const { renderRadius, chunkSize, dimension } = this.engine.config.world;
    this.fogNearColor = new Color(fogNearColor);
    this.fogFarColor = new Color(fogColor);
    this.fogUniforms = {
      uFogColor: { value: this.fogNearColor },
      uFogNearColor: { value: this.fogFarColor },
      uFogNear: { value: renderRadius * 0.5 * chunkSize * dimension },
      uFogFar: { value: renderRadius * chunkSize * dimension },
    };

    engine.on('ready', () => {
      // add postprocessing

      this.fxaa = new ShaderPass(FXAAShader);

      this.composer.addPass(new RenderPass(this.scene, engine.camera.threeCamera));
      this.composer.addPass(this.fxaa);

      this.adjustRenderer();
    });
  }

  adjustRenderer = () => {
    const { width, height } = this.renderSize;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    if (width === 0 || height === 0) return;

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);

    this.composer.setSize(width, height);
    this.composer.setPixelRatio(pixelRatio);

    this.fxaa.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
    this.fxaa.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);
  };

  tick = () => {};

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
