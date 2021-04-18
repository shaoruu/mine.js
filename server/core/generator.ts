type GeneratorOptionsType = {
  basePath: string;
};

type BlockType = {
  isSolid: boolean;
  isFluid: boolean;
  isTransparent: boolean;
};

class Generator {
  public blockTypes: { [key: string]: BlockType };

  constructor(public options: GeneratorOptionsType) {}

  loadBlockTypes = () => {
    // load blocks' files from `basePath`
  };
}

export { Generator };
