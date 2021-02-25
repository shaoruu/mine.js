import { Engine } from '..';

import { MeshStandardMaterial, Texture } from 'three';

type MaterialOptions = {
  color?: string;
  map?: Texture;
};

type BlockType = {
  name: string;
  materialIndex: number;
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
    this.blocks = [];

    this.materialIndices = new Map();
    this.blockIndices = new Map();

    // defaults
    this.addMaterial('dirt', { color: '#edc9af' });
    this.addMaterial('grass', { color: '#41980a' });
  }

  addMaterial = (name: string, options: MaterialOptions) => {
    const { color, map } = options;

    if (!color && !map) {
      throw new Error(`Error adding material, ${name}: no color or map provided.`);
    }

    const material = new MeshStandardMaterial(options);

    const index = this.materials.length;
    this.materialIndices.set(name, index);
    this.materials.push(material);

    return material;
  };

  registerBlock = (name: string, type: string) => {
    const { index: matIndex, material } = this.getMaterial(type);

    if (!material) {
      throw new Error(`Error registering block, ${name}: material not found.`);
    }

    const index = this.blocks.length;
    this.blockIndices.set(name, index);

    const newBlock = {
      name,
      materialIndex: matIndex,
    };

    this.blocks.push(newBlock);

    return newBlock;
  };

  getMaterial = (name: string) => {
    const materialIndex = this.materialIndices.get(name);
    if (materialIndex === undefined) {
      throw new Error(`Material not found: ${name}`);
    }
    return {
      index: materialIndex,
      material: this.materials[materialIndex],
    };
  };

  getBlock = (name: string) => {
    const blockIndex = this.blockIndices.get(name);
    if (blockIndex === undefined) {
      throw new Error(`Block not found: ${name}`);
    }
    return {
      index: blockIndex,
      block: this.blocks[blockIndex],
    };
  };
}

export { Registry };
