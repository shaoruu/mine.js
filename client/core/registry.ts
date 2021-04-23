import { CanvasTexture, ShaderMaterial, Color, ClampToEdgeWrapping, NearestFilter } from 'three';

import { SmartDictionary } from '../../shared';
import { BlockMaterialType, BlockMaterialUVType } from '../libs';

import { Engine } from './engine';
import ChunkFragmentShader from './shaders/chunk/fragment.glsl';
import ChunkVertexShader from './shaders/chunk/vertex.glsl';

type RegistryOptionsType = {
  textureWidth: number;
};

type BlockOptionsType = {
  // states
  isFluid: boolean;
  isEmpty: boolean;
};

type BlockType = {
  name: string;
  material: BlockMaterialType;
  options: BlockOptionsType;
};

class Registry {
  public material: ShaderMaterial;
  public materials: SmartDictionary<BlockMaterialUVType>;
  public blocks: SmartDictionary<BlockType>;
  public cBlockDictionary: { [key: number]: BlockType }; // caches for block uv
  public cMaterialUVDictionary: { [key: string]: BlockMaterialUVType }; // caches for material uv

  constructor(public engine: Engine, public options: RegistryOptionsType) {
    const { chunkSize, dimension, renderRadius } = this.engine.config.world;

    const uTexture = { value: undefined };

    this.material = new ShaderMaterial({
      // wireframe: true,
      fog: true,
      transparent: true,
      vertexShader: ChunkVertexShader,
      fragmentShader: ChunkFragmentShader,
      vertexColors: true,
      uniforms: {
        uTexture,
        uFogColor: { value: new Color(this.engine.config.rendering.fogColor) },
        uFogNear: { value: renderRadius * 0.5 * chunkSize * dimension },
        uFogFar: { value: renderRadius * chunkSize * dimension },
        // uFogNear: { value: 100 },
        // uFogFar: { value: 5000 },
      },
    });

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
          const texture = new CanvasTexture(image);
          texture.wrapS = ClampToEdgeWrapping;
          texture.wrapT = ClampToEdgeWrapping;
          texture.minFilter = NearestFilter;
          texture.magFilter = NearestFilter;
          texture.generateMipmaps = false;
          texture.needsUpdate = true;
          uTexture.value = texture;
        };
      });

    engine.on('ready', () => {
      // texture bleeding?
    });
  }
}

export { Registry, RegistryOptionsType };
