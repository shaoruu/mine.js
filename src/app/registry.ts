import { Color, Material, MeshStandardMaterial, Texture } from 'three';

type MaterialOptions = {
  color?: string;
  map?: Texture;
};

type BlockType = {
  name: string;
  materialIndex: number;
};

class Registry {
  public materials: MeshStandardMaterial[];
  public materialIndices: { [key: string]: number };
  public blocks: BlockType[];
  public blockIndices: { [key: string]: number };

  constructor() {
    console.log('registry');
  }

  addMaterial = (name: string, { color, map }: MaterialOptions) => {
    if (!color && !map) {
      throw new Error(`Error adding material, ${name}: no color or map provided.`);
    }

    const material = new MeshStandardMaterial({
      color: new Color(color),
      map,
    });

    const index = this.materials.length;
    this.materialIndices[name] = index;
    this.materials.push(material);

    return material;
  };

  registerBlock = (name: string, type: string) => {
    const { index: matIndex, material } = this.getMaterial(name);

    if (!material) {
      throw new Error(`Error registering block, ${name}: material not found.`);
    }

    const index = this.blocks.length;
    this.blockIndices[name] = index;

    const newBlock = {
      name,
      materialIndex: matIndex,
    };

    this.blocks.push(newBlock);

    return newBlock;
  };

  getMaterial = (name: string) => {
    const materialIndex = this.materialIndices[name];
    if (!materialIndex) {
      throw new Error(`Material not found: ${name}`);
    }
    return {
      index: materialIndex,
      material: this.materialIndices[materialIndex],
    };
  };

  getBlock = (name: string) => {
    const blockIndex = this.blockIndices[name];
    if (!blockIndex) {
      throw new Error(`Block not found: ${name}`);
    }
    return {
      index: blockIndex,
      block: this.blockIndices[blockIndex],
    };
  };
}

export { Registry };
