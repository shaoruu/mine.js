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
attribute int ao;
attribute int sunlight;
attribute int torchLight;

varying float vAO;
varying float vSunlight;
varying float vTorchLight;

uniform vec4 uAOTable;

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
float s = float(sunlight);
float t = float(torchLight);
vSunlight = s / 15.0;
vTorchLight = t / 15.0;
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
