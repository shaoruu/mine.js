import {
  CanvasTexture,
  ShaderMaterial,
  Color,
  NearestFilter,
  UVMapping,
  RepeatWrapping,
  sRGBEncoding,
  DoubleSide,
  FrontSide,
  BackSide,
  NotEqualDepth,
  GreaterDepth,
  LessDepth,
} from 'three';

import { Engine } from './engine';
import ChunkFragmentShader from './shaders/chunk/fragment.glsl';
import ChunkVertexShader from './shaders/chunk/vertex.glsl';

type RegistryOptionsType = {
  textureWidth: number;
};

class Registry {
  public static materialSetup = false;
  public static atlasUniform: { value: CanvasTexture | null } = { value: null };
  public static materialUniform = {
    uTexture: Registry.atlasUniform,
    uFogColor: { value: new Color(0) },
    uFogNearColor: { value: new Color(0) },
    uFogNear: { value: 0 },
    uFogFar: { value: 0 },
  };

  public static sharedMaterialOptions = {
    vertexShader: ChunkVertexShader,
    fragmentShader: ChunkFragmentShader,
    vertexColors: true,
    uniforms: Registry.materialUniform,
  };

  public static opaqueChunkMaterial = new ShaderMaterial({
    ...Registry.sharedMaterialOptions,
  });

  public static transparentChunkMaterial = new ShaderMaterial({
    // wireframe: true,
    ...Registry.sharedMaterialOptions,
    opacity: 0.25,
    transparent: true,
    side: DoubleSide,
  });

  private static setupMaterial = (engine: Engine) => {
    const { materialUniform } = Registry;
    const { chunkSize, dimension, renderRadius } = engine.config.world;

    materialUniform.uFogColor.value = new Color(engine.config.rendering.fogColor);
    materialUniform.uFogNearColor.value = new Color(engine.config.rendering.fogNearColor);
    materialUniform.uFogNear.value = renderRadius * 0.5 * chunkSize * dimension;
    materialUniform.uFogFar.value = renderRadius * chunkSize * dimension;
  };

  constructor(public engine: Engine, public options: RegistryOptionsType) {
    if (!Registry.materialSetup) {
      Registry.setupMaterial(engine);
      Registry.materialSetup = true;
    }

    fetch(
      `http://${window.location.hostname}${
        window.location.hostname === 'localhost' ? ':4000' : window.location.port ? `:${window.location.port}` : ''
      }/atlas`,
    )
      .then((response) => {
        return response.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.src = url;
        image.onload = () => {
          const atlas = new CanvasTexture(image, UVMapping, RepeatWrapping, RepeatWrapping);
          atlas.minFilter = NearestFilter;
          atlas.magFilter = NearestFilter;
          atlas.generateMipmaps = false;
          atlas.needsUpdate = true;
          atlas.anisotropy = engine.rendering.renderer.capabilities.getMaxAnisotropy();
          atlas.encoding = sRGBEncoding;
          Registry.atlasUniform.value = atlas;
          engine.emit('texture-loaded');
        };
      });
  }
}

export { Registry, RegistryOptionsType };
