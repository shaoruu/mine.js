import { Container, Debug } from './app';

import { EventEmitter } from 'events';

type ConfigType = {
  chunkSize?: number;
  dimension?: number;
  domElement?: HTMLElement;
};

const defaultConfig: ConfigType = {
  chunkSize: 32,
  dimension: 16,
  domElement: document.body,
};

class Engine extends EventEmitter {
  public config: ConfigType;
  public debug: Debug;
  public container: Container;

  constructor(canvas: HTMLCanvasElement | undefined, params: Partial<ConfigType> = defaultConfig) {
    super();

    this.config = {
      ...this.config,
      ...params,
    };

    this.debug = new Debug(this);
    this.container = new Container(this, {
      canvas,
      container: this.config.domElement,
    });
  }

  tick = () => {
    // console.log('tick');
  };

  render = () => {
    // console.log('render');
  };

  resize = () => {
    // console.log('resize');
  };
}

export { Engine };
