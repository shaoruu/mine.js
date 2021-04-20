import fs from 'fs';
import path from 'path';

import { Image } from 'canvas';

import { BlockType, TextureAtlas } from '../libs';

type GeneratorOptionsType = {
  basePath: string;
};

class Generator {
  public blockTypes: { [key: string]: BlockType } = {};
  public textureAtlas: TextureAtlas;

  constructor(public options: GeneratorOptionsType) {
    this.loadBlockTypes();
  }

  getBlockUV = (name: string) => {
    const block = this.blockTypes[name];
    if (!block) {
      console.error(`Block ${name} not found.`);
      process.exit(1);
    }
  };

  loadBlockTypes = () => {
    // load blocks' files from `basePath`
    const { basePath } = this.options;
    const textureMap: { [key: string]: Image } = {};

    const modelFiles = fs.readdirSync(path.join(basePath, 'models'));
    for (const modelFile of modelFiles) {
      const block = require(path.join(basePath, 'models', modelFile)) as BlockType;
      const { name, textures } = block;

      this.blockTypes[name] = block;

      if (textures) {
        const length = Object.keys(textures).length;
        if (length !== 1 && length !== 3 && length !== 6) {
          console.error('Wrong texture format.');
          process.exit(1);
        }

        switch (length) {
          case 1: {
            const texture = fs.readFileSync(path.join(basePath, 'assets', textures.all));
            const img = new Image();
            img.src = texture;
            textureMap[textures.all] = img;
            break;
          }
          case 3:
          case 6: {
            for (const side of Object.keys(textures)) {
              const textureFile = textures[side];
              const texture = fs.readFileSync(path.join(basePath, 'assets', textureFile));
              const img = new Image();
              img.src = texture;
              textureMap[textureFile] = img;
            }
            break;
          }
        }
      }
    }

    this.textureAtlas = new TextureAtlas(textureMap);
  };
}

export { Generator };
