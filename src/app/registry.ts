import { Engine } from '..';

import { Color, MeshStandardMaterial, Texture } from 'three';

type MaterialOptions = {
  color?: string;
  map?: Texture;
};

type BlockType = {
  name: string;
  material: MeshStandardMaterial;
};

class Registry {
  public engine: Engine;

  public materials: MeshStandardMaterial[];
  public materialIndices: Map<string, number>;
  public blocks: BlockType[];
  public blockIndices: Map<string, number>;

  constructor(engine: Engine) {
    this.engine = engine;

    this.materials = [];
    this.materialIndices = new Map();

    this.blocks = [];
    this.blockIndices = new Map();

    this.addMaterial('dirt', { color: '#edc9af' });
    this.addMaterial('grass', { color: '#41980a' });
    this.addMaterial('stone', { color: '#999C9B' });
  }

  addMaterial = (name: string, options: MaterialOptions) => {
    const { color, map } = options;

    if (!color && !map) {
      throw new Error(`Error adding material, ${name}: no color or map provided.`);
    }

    if (this.materialIndices.get(name)) {
      throw new Error(`Error adding material, ${name}: material name taken.`);
    }

    const material = new MeshStandardMaterial(options);

    const index = this.materials.length;
    this.materialIndices.set(name, index);
    this.materials.push(material);

    return material;
  };

  registerBlock = (name: string, type: string) => {
    const material = this.getMaterial(type);

    if (!material) {
      throw new Error(`Error registering block, ${name}: material not found.`);
    }

    if (this.blockIndices.get(name)) {
      throw new Error(`Error registering block, ${name}: block name taken.`);
    }

    const index = this.blocks.length;
    this.blockIndices.set(name, index);

    const newBlock = {
      name,
      material,
    };

    this.blocks.push(newBlock);

    return newBlock;
  };

  getMaterialIndex = (name: string) => {
    const materialIndex = this.materialIndices.get(name);
    return materialIndex === undefined ? -1 : materialIndex;
  };

  getMaterial = (name: string) => {
    const index = this.getMaterialIndex(name);
    return index < 0 ? null : this.materials[index];
  };

  getBlockIndex = (name: string) => {
    const blockIndex = this.blockIndices.get(name);
    return blockIndex === undefined ? -1 : blockIndex;
  };

  getBlock = (name: string) => {
    const index = this.getBlockIndex(name);
    return index < 0 ? null : this.blocks[index];
  };
}

export { Registry };
