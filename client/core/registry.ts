import { ShaderMaterial, Color, NearestFilter, sRGBEncoding, FrontSide, TextureLoader, Texture } from 'three';

import { Engine } from './engine';
import ChunkFragmentShader from './shaders/chunk/fragment.glsl';
import ChunkVertexShader from './shaders/chunk/vertex.glsl';

type RegistryOptionsType = {
  textureWidth: number;
};

const TRANSPARENT_SIDES = [FrontSide];

class Registry {
  public static materialSetup = false;
  public static atlasUniform: { value: Texture | null } = {
    value: new TextureLoader().load(
      `http://${window.location.hostname}${
        window.location.hostname === 'localhost' ? ':4000' : window.location.port ? `:${window.location.port}` : ''
      }/atlas`,
    ),
  };
  public static materialUniform = {
    uTexture: Registry.atlasUniform,
    uSunlightIntensity: { value: 0.2 },
    uFogColor: { value: new Color(0) },
    uFogNearColor: { value: new Color(0) },
    uFogNear: { value: 0 },
    uFogFar: { value: 0 },
  };

  public static sharedMaterialOptions = {
    // wireframe: true,
    vertexShader: ChunkVertexShader,
    fragmentShader: ChunkFragmentShader,
    vertexColors: true,
    uniforms: Registry.materialUniform,
  };

  public static opaqueChunkMaterial = new ShaderMaterial({
    ...Registry.sharedMaterialOptions,
  });

  public static transparentChunkMaterials = TRANSPARENT_SIDES.map(
    (side) =>
      new ShaderMaterial({
        ...Registry.sharedMaterialOptions,
        transparent: true,
        depthWrite: false,
        alphaTest: 0.5,
        side,
      }),
  );

  private static setupMaterial = (engine: Engine) => {
    const {
      materialUniform,
      atlasUniform: { value: atlas },
    } = Registry;
    const { chunkSize, dimension, renderRadius } = engine.config.world;

    materialUniform.uFogColor.value = new Color(engine.config.rendering.fogColor);
    materialUniform.uFogNearColor.value = new Color(engine.config.rendering.fogNearColor);
    materialUniform.uFogNear.value = renderRadius * 0.5 * chunkSize * dimension;
    materialUniform.uFogFar.value = renderRadius * chunkSize * dimension;

    atlas.minFilter = NearestFilter;
    atlas.magFilter = NearestFilter;
    atlas.generateMipmaps = false;
    atlas.needsUpdate = true;
    atlas.encoding = sRGBEncoding;
  };

  constructor(public engine: Engine, public options: RegistryOptionsType) {
    if (!Registry.materialSetup) {
      Registry.setupMaterial(engine);
      Registry.materialSetup = true;
    }
  }
}

export { Registry, RegistryOptionsType };
