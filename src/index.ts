import { Debug } from './app/debug';

type ConfigType = {
  chunkSize?: number;
  dimension: number;
};

const defaultConfig: ConfigType = {
  chunkSize: 32,
  dimension: 16,
};

class Engine {
  public config: ConfigType = defaultConfig;
  public debug: Debug;

  constructor(params: Partial<ConfigType>) {
    this.config = {
      ...this.config,
      ...params,
    };

    this.debug = new Debug(this);
  }
}

export { Engine };
