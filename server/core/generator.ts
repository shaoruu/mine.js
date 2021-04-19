import fs from 'fs';
import path from 'path';

import { BlockType } from '../libs';

type GeneratorOptionsType = {
  basePath: string;
};

class Generator {
  public blockTypes: { [key: string]: BlockType };

  constructor(public options: GeneratorOptionsType) {
    this.loadBlockTypes();
  }

  loadBlockTypes = () => {
    // load blocks' files from `basePath`
    const { basePath } = this.options;

    const modelFiles = fs.readdirSync(path.join(basePath, 'models'));
    modelFiles.forEach((modelFile) => {
      const test = require(path.join(basePath, 'models', modelFile));
      console.log(test);
    });
  };
}

export { Generator };
