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
} from 'three';

import { Engine } from './engine';

type RegistryOptionsType = {
  textureWidth: number;
};

const TRANSPARENT_SIDES = [FrontSide, BackSide];

class Registry {
  public atlasUniform: { value: Texture | null };

  public opaqueChunkMaterial: ShaderMaterial;

  public transparentChunkMaterials: ShaderMaterial[];

  constructor(public engine: Engine, public options: RegistryOptionsType) {
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
varying float vSunlight;
varying float vTorchLight;
`,
        )
        .replace(
          '#include <envmap_fragment>',
          `
#include <envmap_fragment>
outgoingLight *= min(vTorchLight + (vSunlight + 0.1) * uSunlightIntensity, 1.0);
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
attribute float ao;
attribute float sunlight;
attribute float torchLight;

varying float vAO;
varying float vSunlight;
varying float vTorchLight;

#include <common>
`,
        )
        .replace(
          '#include <color_vertex>',
          `
#include <color_vertex>

vAO = ao;
vSunlight = sunlight / 15.0;
vTorchLight = torchLight / 15.0;
`,
        ),

      uniforms: {
        ...UniformsUtils.clone(ShaderLib.basic.uniforms),
        map: this.atlasUniform,
        uSunlightIntensity: this.engine.world.uSunlightIntensity,
        ...this.engine.rendering.fogUniforms,
      },
    });

    // @ts-ignore
    material.map = this.atlasUniform.value;

    return material;
  };
}

export { Registry, RegistryOptionsType };
