import {
  ShaderMaterial,
  NearestFilter,
  sRGBEncoding,
  FrontSide,
  TextureLoader,
  Texture,
  ShaderLib,
  UniformsUtils,
  BackSide,
  Vector4,
} from 'three';

import { Engine } from './engine';

type RegistryOptionsType = {
  textureWidth: number;
};

const TRANSPARENT_SIDES = [FrontSide, BackSide];

class Registry {
  public atlasUniform: { value: Texture | null };
  public aoUniform: { value: Vector4 };

  public opaqueChunkMaterial: ShaderMaterial;

  public transparentChunkMaterials: ShaderMaterial[];

  constructor(public engine: Engine, public options: RegistryOptionsType) {
    this.aoUniform = { value: new Vector4(100.0, 170.0, 210.0, 255.0) };

    engine.on('ready', () => {
      this.atlasUniform = {
        value: new TextureLoader().load(`${engine.network.cleanURL}atlas`),
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
    });
  }

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
