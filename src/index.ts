import { Camera, Container, Debug, Rendering, World } from './app';

import { EventEmitter } from 'events';

type ConfigType = {
  domElement?: HTMLElement;
};

const defaultConfig: ConfigType = {
  domElement: document.body,
};

class Engine extends EventEmitter {
  public config: ConfigType;
  public debug: Debug;
  public container: Container;
  public rendering: Rendering;
  public camera: Camera;
  public world: World;

  constructor(canvas: HTMLCanvasElement | undefined, params: Partial<ConfigType> = defaultConfig) {
    super();

    this.config = {
      ...this.config,
      ...params,
    };

    // debug
    this.debug = new Debug(this);

    // container
    this.container = new Container(this, {
      ...this.config,
      canvas,
    });

    // rendering
    this.rendering = new Rendering(this);

    // camera
    this.camera = new Camera(this);

    // world
    this.world = new World(this);

    this.boot();
  }

  boot = () => {
    this.debug.mount();

    const cycle = () => {
      this.debug.stats.begin();

      this.tick();
      this.render();

      this.debug.stats.end();

      requestAnimationFrame(cycle);
    };

    cycle();
  };

  tick = () => {
    // console.log('tick');
    this.camera.tick();
    this.world.tick();
    this.rendering.tick();
  };

  render = () => {
    // console.log('render');
    this.rendering.render();
  };

  resize = () => {
    // console.log('resize');
  };
}

export { Engine };
