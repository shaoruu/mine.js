import { ShaderMaterial, NearestFilter, sRGBEncoding, FrontSide, TextureLoader, Texture } from 'three';

import { Engine } from './engine';
import ChunkFragmentShader from './shaders/chunk/fragment.glsl';
import ChunkVertexShader from './shaders/chunk/vertex.glsl';

type RegistryOptionsType = {
  textureWidth: number;
};

const TRANSPARENT_SIDES = [FrontSide];

class Registry {
  public atlasUniform: { value: Texture | null };
  public static materialSetup = false;
  public materialUniform: { [key: string]: { value: any } };

  public opaqueChunkMaterial: ShaderMaterial;

  public transparentChunkMaterials: ShaderMaterial[];

  constructor(public engine: Engine, public options: RegistryOptionsType) {
    engine.on('ready', () => {
      this.atlasUniform = {
        value: new TextureLoader().load(`${engine.network.url.clearQuery().toString()}atlas`),
      };

      const atlas = this.atlasUniform.value;

      atlas.minFilter = NearestFilter;
      atlas.magFilter = NearestFilter;
      atlas.generateMipmaps = false;
      atlas.needsUpdate = true;
      atlas.encoding = sRGBEncoding;

      this.materialUniform = {
        uTexture: this.atlasUniform,
        uSunlightIntensity: engine.world.uSunlightIntensity,
        ...engine.rendering.fogUniforms,
      };

      const sharedMaterialOptions = {
        // wireframe: true,
        vertexShader: ChunkVertexShader,
        fragmentShader: ChunkFragmentShader,
        vertexColors: true,
        uniforms: this.materialUniform,
      };

      this.opaqueChunkMaterial = new ShaderMaterial({
        ...sharedMaterialOptions,
      });

      this.transparentChunkMaterials = TRANSPARENT_SIDES.map(
        (side) =>
          new ShaderMaterial({
            ...sharedMaterialOptions,
            transparent: true,
            depthWrite: false,
            alphaTest: 0.5,
            side,
          }),
      );
    });
  }
}

export { Registry, RegistryOptionsType };
