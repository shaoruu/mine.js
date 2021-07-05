import {
  BackSide,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  FrontSide,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneBufferGeometry,
  Scene,
  ShaderLib,
  ShaderMaterial,
  sRGBEncoding,
  Texture,
  TextureLoader,
  UniformsUtils,
  Vector4,
  WebGLRenderer,
} from 'three';

import { Helper } from '../utils';

import { Engine } from './engine';

type Block = {
  redLightLevel: number;
  greenLightLevel: number;
  blueLightLevel: number;
  isBlock: boolean;
  isEmpty: boolean;
  isFluid: boolean;
  isLight: boolean;
  isPlant: boolean;
  isPlantable: boolean;
  isSolid: boolean;
  isTransparent: boolean;
  name: string;
  textures: { [key: string]: string };
  transparentStandalone: boolean;
};

type Range = {
  [key: string]: {
    startU: number;
    endU: number;
    startV: number;
    endV: number;
  };
};

type RegistryOptionsType = {
  focusDist: number;
  focusBlockSize: number;
  focusPlantSize: number;
  resolution: number;
  blocks?: Block[];
  ranges?: Range[];
};

const TRANSPARENT_SIDES = [FrontSide, BackSide];

class Registry {
  public atlasUniform: { value: Texture | null };
  public aoUniform: { value: Vector4 };

  public opaqueChunkMaterial: ShaderMaterial;
  public transparentChunkMaterials: ShaderMaterial[];

  public focuses: { [id: string]: HTMLCanvasElement } = {};

  private camera: OrthographicCamera;
  private bufferScene: Scene;
  private material: MeshBasicMaterial;
  private blockGeometry: BufferGeometry;
  private plantGeometry: BufferGeometry;

  constructor(public engine: Engine, public options: RegistryOptionsType) {
    const { focusDist, focusBlockSize, focusPlantSize } = options;

    this.aoUniform = { value: new Vector4(100.0, 170.0, 210.0, 255.0) };

    // set near to -10 to render the whole block without cutting the edge
    this.camera = new OrthographicCamera(-focusDist, focusDist, focusDist, -focusDist, -focusPlantSize);
    this.bufferScene = new Scene();

    this.blockGeometry = new BufferGeometry();
    this.plantGeometry = new PlaneBufferGeometry(focusPlantSize, focusPlantSize);
    this.plantGeometry.rotateZ(-Math.PI / 2);

    this.blockGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(
        Helper.flatten([
          // nx
          [0, 1, 0],
          [0, 0, 0],
          [0, 1, 1],
          [0, 0, 1],
          // px
          [1, 1, 1],
          [1, 0, 1],
          [1, 1, 0],
          [1, 0, 0],
          // ny
          [1, 0, 1],
          [0, 0, 1],
          [1, 0, 0],
          [0, 0, 0],
          // py
          [0, 1, 1],
          [1, 1, 1],
          [0, 1, 0],
          [1, 1, 0],
          // nz
          [1, 0, 0],
          [0, 0, 0],
          [1, 1, 0],
          [0, 1, 0],
          // pz
          [0, 0, 1],
          [1, 0, 1],
          [0, 1, 1],
          [1, 1, 1],
        ]).map((e) => e * focusBlockSize),
        3,
      ),
    );
    const base = [0, 1, 3, 3, 2, 0];
    this.blockGeometry.setIndex(
      Helper.flatten([
        base,
        base.map((e) => e + 4),
        base.map((e) => e + 8),
        base.map((e) => e + 12),
        base.map((e) => e + 16),
        base.map((e) => e + 20),
      ]),
    );

    engine.on('ready', () => {
      this.atlasUniform = {
        value: new TextureLoader().load(`${engine.network.cleanURL}atlas`, () => {
          engine.emit('texture-loaded');
        }),
      };

      const atlas = this.atlasUniform.value;

      atlas.minFilter = NearestFilter;
      atlas.magFilter = NearestFilter;
      atlas.generateMipmaps = false;
      atlas.encoding = sRGBEncoding;

      this.opaqueChunkMaterial = this.makeShaderMaterial();
      this.transparentChunkMaterials = TRANSPARENT_SIDES.map((side) => {
        const material = this.makeShaderMaterial();
        material.side = side;
        material.transparent = true;
        material.alphaTest = 0.3;
        return material;
      });
      this.material = new MeshBasicMaterial({ map: this.atlasUniform.value, side: DoubleSide });
    });

    engine.on('texture-loaded', () => {
      // console.log(this.focus(2).toDataURL());
      // Object.keys(options.blocks).forEach((idStr) => {
      //   const id = +idStr;
      //   this.focuses[idStr] = this.focus(id);
      // });
    });
  }

  focus = (id: number) => {
    const { isBlock, isPlant } = this.options.blocks[id];
    if (isBlock) {
      return this.focusBlock(id);
    } else if (isPlant) {
      return this.focusPlant(id);
    }
  };

  focusBlock = (id: number) => {
    const { focusDist, resolution } = this.options;
    const { textures } = this.options.blocks[id];

    this.camera.position.set(focusDist, focusDist, focusDist);
    this.camera.lookAt(0, 0, 0);

    // ny
    const bottomUVs = [
      [1, 0],
      [0, 0],
      [1, 1],
      [0, 1],
    ].map((uv) =>
      this.getUV(textures['all'] ? textures['all'] : textures['bottom'] ? textures['bottom'] : textures['ny'], uv),
    );

    // py
    const topUVs = [
      [1, 1],
      [0, 1],
      [1, 0],
      [0, 0],
    ].map((uv) =>
      this.getUV(textures['all'] ? textures['all'] : textures['top'] ? textures['top'] : textures['py'], uv),
    );

    // nx
    const side1UVs = [
      [0, 1],
      [0, 0],
      [1, 1],
      [1, 0],
    ].map((uv) =>
      this.getUV(textures['all'] ? textures['all'] : textures['side'] ? textures['side'] : textures['nx'], uv),
    );

    // px
    const side2UVs = [
      [0, 1],
      [0, 0],
      [1, 1],
      [1, 0],
    ].map((uv) =>
      this.getUV(textures['all'] ? textures['all'] : textures['side'] ? textures['side'] : textures['px'], uv),
    );

    // nz
    const side3UVs = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ].map((uv) =>
      this.getUV(textures['all'] ? textures['all'] : textures['side'] ? textures['side'] : textures['nz'], uv),
    );

    // pz
    const side4UVs = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ].map((uv) =>
      this.getUV(textures['all'] ? textures['all'] : textures['side'] ? textures['side'] : textures['pz'], uv),
    );

    const uvs = Helper.flatten([...side1UVs, ...side2UVs, ...bottomUVs, ...topUVs, ...side3UVs, ...side4UVs]);
    this.blockGeometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

    const mesh = new Mesh(this.blockGeometry, this.material);
    mesh.frustumCulled = false;

    while (this.bufferScene.children.length > 0) {
      this.bufferScene.remove(this.bufferScene.children[0]);
    }

    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;

    const renderer = new WebGLRenderer({ canvas, alpha: true });

    this.bufferScene.add(mesh);
    renderer.render(this.bufferScene, this.camera);
    this.engine.rendering.scene.add(mesh);

    return canvas;
  };

  focusPlant = (id: number) => {
    const { focusDist, resolution } = this.options;
    const { textures } = this.options.blocks[id];

    this.camera.position.set(0, 0, -focusDist);
    this.camera.lookAt(0, 1, 0);

    const oneUVs = [
      [0, 1],
      [0, 0],
      [1, 1],
      [1, 0],
    ].map((uv) => this.getUV(textures['one'], uv));

    const uvs = Helper.flatten(oneUVs);
    this.plantGeometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

    const mesh = new Mesh(this.plantGeometry, this.material);
    mesh.frustumCulled = false;

    while (this.bufferScene.children.length > 0) {
      this.bufferScene.remove(this.bufferScene.children[0]);
    }

    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;

    const renderer = new WebGLRenderer({ canvas, alpha: true });

    this.bufferScene.add(mesh);
    renderer.render(this.bufferScene, this.camera);

    return canvas;
  };

  getUV = (file: string, uv: number[]) => {
    const range = this.options.ranges[file];
    if (!range) {
      console.error(`Range not found for: ${file}`);
      return;
    }

    const { startU, endU, startV, endV } = range;
    return [uv[0] * (endU - startU) + startU, uv[1] * (startV - endV) + endV];
  };

  private makeShaderMaterial = () => {
    const material = new ShaderMaterial({
      vertexColors: true,
      fragmentShader: ShaderLib.basic.fragmentShader
        .replace(
          '#include <common>',
          `
#include <common>
uniform vec3 uFogColor;
uniform vec3 uFogNearColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uSunlightIntensity;

varying float vAO;
varying vec4 vLight; 
`,
        )
        .replace(
          '#include <envmap_fragment>',
          `
#include <envmap_fragment>
float s = (vLight.a + 0.06) * uSunlightIntensity * 0.8;
float scale = 1.0;
outgoingLight.rgb *= vec3(s + pow(vLight.r, scale), s + pow(vLight.g, scale), s + pow(vLight.b, scale));
outgoingLight *= 0.58 * vAO;
`,
        )
        .replace(
          '#include <fog_fragment>',
          `
float depth = gl_FragCoord.z / gl_FragCoord.w;
float fogFactor = smoothstep(uFogNear, uFogFar, depth);
gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(uFogNearColor, uFogColor, fogFactor), fogFactor);
`,
        ),
      vertexShader: ShaderLib.basic.vertexShader
        .replace(
          '#include <common>',
          `
attribute int ao;
attribute int light;

varying float vAO;
varying vec4 vLight;

uniform vec4 uAOTable;

vec4 unpackLight(int l) {
  float r = float((l >> 8) & 0xF) / 15.0;
  float g = float((l >> 4) & 0xF) / 15.0;
  float b = float(l & 0xF) / 15.0;
  float s = float((l >> 12) & 0xF) / 15.0;
  return vec4(r, g, b, s);
}

#include <common>
`,
        )
        .replace(
          '#include <color_vertex>',
          `
#include <color_vertex>

vAO = ((ao == 0) ? uAOTable.x :
    (ao == 1) ? uAOTable.y :
    (ao == 2) ? uAOTable.z : uAOTable.w) / 255.0; 
vLight = unpackLight(light);
`,
        ),

      uniforms: {
        ...UniformsUtils.clone(ShaderLib.basic.uniforms),
        map: this.atlasUniform,
        uSunlightIntensity: this.engine.world.uSunlightIntensity,
        uAOTable: this.aoUniform,
        ...this.engine.rendering.fogUniforms,
      },
    });

    // @ts-ignore
    material.map = this.atlasUniform.value;

    return material;
  };
}

export { Registry, RegistryOptionsType };
