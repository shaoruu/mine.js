import fs from 'fs';
import path from 'path';

import { Image } from 'canvas';

import { TypeMap } from '../../shared';
import { BlockType, TextureAtlas, TextureType } from '../libs';

type RegistryOptionsType = {
  basePath: string;
};

type TextureMapType = {
  [key: string]: Image;
};

class Registry {
  public blockTypes: { [key: string]: BlockType } = {};
  public blockTypesArr: BlockType[] = [];
  public textureAtlas: TextureAtlas;

  constructor(public options: RegistryOptionsType) {
    this.loadBlockTypes();
  }

  getTransparencyByID = (id: number) => {
    if (id === undefined) return true;
    return this.getBlockByID(id).isTransparent;
  };

  getTransparencyByName = (name: string) => {
    return this.getBlockByName(name).isTransparent;
  };

  getFluidityByID = (id: number) => {
    if (id === undefined) return false;
    return this.getBlockByID(id).isFluid;
  };

  getFluidityByName = (name: string) => {
    return this.getBlockByName(name).isFluid;
  };

  getSolidityByID = (id: number) => {
    if (id === undefined) return false;
    return this.getBlockByID(id).isSolid;
  };

  getSolidityByName = (name: string) => {
    return this.getBlockByName(name).isSolid;
  };

  getEmptinessByID = (id: number) => {
    return this.getBlockByID(id).isEmpty;
  };

  getEmptinessByName = (name: string) => {
    return this.getBlockByName(name).isEmpty;
  };

  getBlockByID = (id: number) => {
    return this.blockTypesArr[id] || ({} as BlockType);
  };

  getBlockByName = (name: string) => {
    return this.blockTypes[name] || ({} as BlockType);
  };

  getTextureByID = (id: number) => {
    return this.getBlockByID(id).textures;
  };

  getTextureByName = (name: string) => {
    return this.getBlockByName(name).textures;
  };

  getUVByID = (id: number) => {
    const block = this.getBlockByID(id);
    return this.getUV(block);
  };

  getUVByName = (name: string) => {
    const block = this.getBlockByName(name);
    return this.getUV(block);
  };

  getUV = (block: BlockType) => {
    // if block is empty
    if (!block.name) {
      console.error(`Block ${name} not found.`);
      process.exit(1);
    }

    const uvMap: { [key: string]: { startU: number; endU: number; startV: number; endV: number } } = {};

    Object.keys(block.textures).forEach((key) => {
      const source = block.textures[key];
      const uv = this.textureAtlas.ranges[source];
      uvMap[source] = uv;
    });

    return uvMap;
  };

  getTypeMap = (blockTypes: string[]) => {
    const typeMap: TypeMap = {};
    blockTypes.forEach((type) => (typeMap[type] = this.blockTypes[type].id));
    return typeMap;
  };

  isAir = (type: number) => {
    return this.getBlockByID(type).name === 'air';
  };

  loadTexture = (textureFile: string, textureMap: TextureMapType) => {
    const { basePath } = this.options;
    const extension = path.extname(textureFile);
    switch (extension) {
      case '.png':
      case '.jpg':
      case '.jpeg': {
        const texture = fs.readFileSync(path.join(basePath, 'assets', 'images', textureFile));
        const img = new Image();
        img.src = texture;
        textureMap[textureFile] = img;
        break;
      }
      case '.ts': {
        const img = require(path.join(basePath, 'assets', 'procedural', textureFile));
        if (!(img instanceof Image))
          throw new Error(`Procedural texture exports the wrong type. Has to be exporting an Image: ${textureFile}`);
        textureMap[textureFile] = img;
        break;
      }
    }
  };

  loadBlockTypes = () => {
    // load blocks' files from `basePath`
    const { basePath } = this.options;
    const textureMap: TextureMapType = {};

    const modelFiles = fs.readdirSync(path.join(basePath, 'models'));
    for (const modelFile of modelFiles) {
      const block = require(path.join(basePath, 'models', modelFile)) as BlockType;
      const { name, textures, id } = block;

      this.blockTypes[name] = block;
      this.blockTypesArr[id] = block;

      if (textures) {
        const length = Object.keys(textures).length;
        if (length !== 1 && length !== 3 && length !== 6) {
          console.error('Wrong texture format.');
          process.exit(1);
        }

        switch (length) {
          case 1: {
            this.loadTexture(textures.all, textureMap);
            break;
          }
          case 3:
          case 6: {
            for (const side of Object.keys(textures)) {
              this.loadTexture(textures[side], textureMap);
            }
            break;
          }
        }
      }
    }

    this.textureAtlas = new TextureAtlas(textureMap);
  };

  static getTextureType = (texture: TextureType) => {
    const l = Object.keys(texture).length;
    return l === 1 ? 'mat1' : l === 3 ? 'mat3' : l === 6 ? 'mat6' : 'x';
  };
}

export { Registry };
