import { MeshStandardMaterial, Texture, CanvasTexture } from 'three';

import { Engine } from '..';
import { SmartDictionary, TextureMerger } from '../libs';

type RegistryOptionsType = {
  textureWidth: number;
};

type MaterialOptions = {
  color?: string;
  map?: Texture;
};

type BlockType = {
  name: string;
  material: MeshStandardMaterial | null;
};

const defaultRegistryOptions: RegistryOptionsType = {
  textureWidth: 16,
};

class Registry {
  public engine: Engine;
  public options: RegistryOptionsType;

  public materials: SmartDictionary<MeshStandardMaterial>;
  public blocks: SmartDictionary<BlockType>;

  private textureMap: { [key: string]: Texture } = {};
  private textureMerger: TextureMerger;

  constructor(engine: Engine, options: Partial<RegistryOptionsType> = {}) {
    this.engine = engine;
    this.options = {
      ...defaultRegistryOptions,
      ...options,
    };

    this.materials = new SmartDictionary<MeshStandardMaterial>();
    this.blocks = new SmartDictionary<BlockType>();

    this.addMaterial('dirt', { color: '#edc9af' });
    this.addMaterial('grass', { color: '#41980a' });
    this.addMaterial('stone', { color: '#999C9B' });

    this.addBlock('air');
    this.addBlock('dirt', 'dirt');
    this.addBlock('grass', 'grass');
    this.addBlock('stone', 'stone');
  }

  addMaterial = (name: string, options: MaterialOptions) => {
    const { color, map } = options;

    if (!color && !map) {
      throw new Error(`Error adding material, ${name}: no color or map provided.`);
    }

    if (this.materials.getIndex(name) >= 0) {
      throw new Error(`Error adding material, ${name}: material name taken.`);
    }

    let texture: Texture = map ? this.makeDataTexture(color || '') : new Texture();
    if (!map) {
      texture = this.makeDataTexture(color || '');
    } else {
      // TODO: handle maps
    }

    this.textureMap[name] = texture;

    console.log(this.textureMap);
    this.textureMerger = new TextureMerger(this.textureMap);
    console.log(this.textureMerger);

    const material = new MeshStandardMaterial(options);
    const matID = this.materials.set(name, material);

    return matID;
  };

  addBlock = (name: string, type = 'none') => {
    if (type === 'none') {
      const noneBlock = {
        name,
        material: null,
      };
      this.blocks.set(name, noneBlock);
      return noneBlock;
    }

    const material = this.getMaterial(type);

    if (!material) {
      throw new Error(`Error registering block, ${name}: material not found.`);
    }

    if (this.blocks.getIndex(name) >= 0) {
      throw new Error(`Error registering block, ${name}: block name taken.`);
    }

    const newBlock = {
      name,
      material,
    };

    const blockID = this.blocks.set(name, newBlock);

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

  getBlockIndex = (name: string) => {
    return this.blocks.getIndex(name);
  };

  getBlock = (name: string) => {
    return this.blocks.get(name);
  };

  private makeDataTexture(color: string) {
    const { textureWidth } = this.options;
    const tempCanvas = document.createElement('canvas') as HTMLCanvasElement;
    tempCanvas.width = textureWidth;
    tempCanvas.height = textureWidth;
    const context = tempCanvas.getContext('2d');
    if (context) {
      context.fillStyle = color;
      context.fill();
    }
    return new CanvasTexture(tempCanvas);
  }
}

export { Registry };
