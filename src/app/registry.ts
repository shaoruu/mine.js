import { Texture, CanvasTexture, ShaderMaterial, Color } from 'three';

import { Engine } from '..';
import { BlockMaterialType, BlockMaterialUVType, SmartDictionary, TextureAtlas } from '../libs';

import ChunkFragmentShader from './shaders/chunk/fragment.glsl';
import ChunkVertexShader from './shaders/chunk/vertex.glsl';

type RegistryOptionsType = {
  textureWidth: number;
};

type MaterialOptionsType = {
  color?: string;
  texture?: Texture;
  image?: HTMLImageElement;
};

type BlockOptionsType = {
  lightLevel: number;

  // states
  isFluid: boolean;
  isEmpty: boolean;
};

type BlockType = {
  name: string;
  material: BlockMaterialType;
  options: BlockOptionsType;
};

const defaultBlockOptions: BlockOptionsType = {
  lightLevel: 0,
  isFluid: false,
  isEmpty: false,
};

function reportMaterialError(name: string, message: string) {
  throw new Error(`Error adding material, ${name}: ${message}`);
}

function reportBlockError(name: string, message: string) {
  throw new Error(`Error registering block, ${name}: ${message}`);
}

class Registry {
  public engine: Engine;
  public options: RegistryOptionsType;

  public material: ShaderMaterial;
  public materials: SmartDictionary<BlockMaterialUVType>;
  public blocks: SmartDictionary<BlockType>;
  public cBlockDictionary: { [key: number]: BlockType }; // caches for block uv
  public cMaterialUVDictionary: { [key: string]: BlockMaterialUVType }; // caches for material uv

  private textureMap: { [key: string]: Texture } = {};
  private textureAtlas: TextureAtlas;

  constructor(engine: Engine, options: RegistryOptionsType) {
    this.engine = engine;
    this.options = options;

    this.materials = new SmartDictionary<BlockMaterialUVType>();
    this.blocks = new SmartDictionary<BlockType>();

    this.addMaterial('dirt', { color: '#edc9af' });
    this.addMaterial('grass', { color: '#41980a' });
    this.addMaterial('stone', { color: '#999C9B' });

    this.addBlock('air');
    this.addBlock('dirt', 'dirt');
    this.addBlock('grass', 'grass');
    this.addBlock('stone', 'stone');

    engine.on('ready', () => {
      // texture bleeding?
      this.textureAtlas.mergedTexture.anisotropy = this.engine.rendering.renderer.capabilities.getMaxAnisotropy();
    });
  }

  addMaterial = (name: string, options: MaterialOptionsType) => {
    const { textureWidth } = this.options;
    const { color, image, texture } = options;
    const { chunkSize, dimension, renderRadius } = this.engine.config.worldOptions;

    if (!color && !image && !texture) {
      reportMaterialError(name, 'no color or map provided.');
    }

    if (this.materials.getIndex(name) >= 0) {
      // ? Should material be replaceable?
      console.warn('Material,', name, 'has been replaced.');
    }

    const blockTexture: Texture = texture || image ? this.makeImageTexture(image) : this.makeCanvasTexture(color || '');
    this.textureMap[name] = blockTexture;
    this.textureAtlas = new TextureAtlas(this.textureMap, { textureDimension: textureWidth });
    this.material = new ShaderMaterial({
      // wireframe: true,
      fog: true,
      transparent: true,
      vertexShader: ChunkVertexShader,
      fragmentShader: ChunkFragmentShader,
      vertexColors: true,
      uniforms: {
        uTexture: { value: this.textureAtlas.mergedTexture },
        uFogColor: { value: new Color(this.engine.config.renderingOptions.fogColor) },
        uFogNear: { value: renderRadius * 0.6 * chunkSize * dimension },
        uFogFar: { value: renderRadius * chunkSize * dimension },
        // uFogNear: { value: 100 },
        // uFogFar: { value: 5000 },
      },
    });

    const { ranges } = this.textureAtlas;
    for (const name in ranges) {
      this.materials.set(name, ranges[name]);
    }
    const matID = this.materials.get(name);

    this.updateCache();

    return matID;
  };

  addBlock = (name: string, material: BlockMaterialType = null, options: Partial<BlockOptionsType> = {}) => {
    const fullOptions = {
      ...defaultBlockOptions,
      ...options,
    };

    // options filtering
    fullOptions.lightLevel = Math.min(fullOptions.lightLevel, this.engine.config.worldOptions.maxLightLevel);

    if (this.blocks.getIndex(name) >= 0) {
      console.warn('Block,', name, 'has been replaced.');
    }

    if (material === null) {
      const noneBlock = {
        name,
        material: null,
        options: fullOptions,
      };
      const noneBlockID = this.blocks.set(name, noneBlock);
      return noneBlockID;
    }

    if (Array.isArray(material)) {
      if (material.length !== 3 && material.length !== 6) {
        reportBlockError(name, 'material array must be in length of 3 or 6.');
      }
      // if 3 elements: [top, side, bottom]
      // if 6 elements: [px, py, pz, nx, ny, nz]
      const [a, b, c, d, e, f] = material;
      if ((Array.length === 3 && (!a || !b || !c)) || (Array.length === 6 && (!a || !b || !c || !d || !e || !f))) {
        reportBlockError(name, 'containing empty material.');
      }

      for (let i = 0; i < material.length; i++) {
        const mat = material[i];
        if (!this.materials.has(mat)) {
          throw new Error(`Error registering block, ${name}: material '${mat}'not found.`);
        }
      }
    }

    const newBlock = {
      name,
      material,
      options: fullOptions,
    };

    const blockID = this.blocks.set(name, newBlock);

    this.updateCache();

    return blockID;
  };

  getMaterialByIndex = (index: number) => {
    return this.materials.getByIndex(index);
  };

  getMaterialIndex = (name: string) => {
    return this.materials.getIndex(name);
  };

  getMaterial = (name: string) => {
    return this.materials.get(name);
  };

  getBlockByIndex = (index: number) => {
    return this.blocks.getByIndex(index);
  };

  getBlockIndex = (name: string) => {
    return this.blocks.getIndex(name);
  };

  getBlock = (name: string) => {
    return this.blocks.get(name);
  };

  getLightByIndex = (index: number) => {
    return this.getBlockByIndex(index).options.lightLevel;
  };

  getLight = (name: string) => {
    return this.getBlock(name)?.options.lightLevel;
  };

  get mergedTexture() {
    return this.textureAtlas.mergedTexture;
  }

  private makeCanvasTexture(color: string) {
    const { textureWidth } = this.options;
    const tempCanvas = document.createElement('canvas') as HTMLCanvasElement;
    const context = tempCanvas.getContext('2d');

    if (context) {
      context.canvas.width = textureWidth;
      context.canvas.height = textureWidth;
      context.fillStyle = color;
      context.fillRect(0, 0, textureWidth, textureWidth);
    }

    return new CanvasTexture(context ? context.canvas : tempCanvas);
  }

  private makeImageTexture(image?: HTMLImageElement) {
    if (image) {
      const { textureWidth } = this.options;
      image.style.width = `${textureWidth}px`;
      image.style.height = 'auto';
    }
    const texture = new Texture(image);
    texture.needsUpdate = true;
    return texture;
  }

  private updateCache() {
    this.cBlockDictionary = this.blocks.toIndexMap();
    this.cMaterialUVDictionary = this.materials.toObject();
  }
}

export { Registry, RegistryOptionsType };
