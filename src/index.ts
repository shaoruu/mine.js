import { EventEmitter } from 'events';

import {
  Camera,
  Container,
  ContainerOptionsType,
  Debug,
  Inputs,
  Physics,
  Registry,
  Rendering,
  World,
  WorldOptionsType,
} from './app';
import { Clock } from './libs';

type ConfigType = {
  debug: boolean;
  containerOptions: Partial<ContainerOptionsType>;
  worldOptions: Partial<WorldOptionsType>;
};

const defaultConfig: ConfigType = {
  debug: true,
  containerOptions: {
    canvas: undefined,
    domElement: document.body,
  },
  worldOptions: {
    generator: 'sin-cos',
    renderRadius: 5,
  },
};

class Engine extends EventEmitter {
  public config: ConfigType;
  public debug: Debug;
  public clock: Clock;
  public container: Container;
  public rendering: Rendering;
  public inputs: Inputs;
  public camera: Camera;
  public registry: Registry;
  public world: World;
  public physics: Physics;

  public paused = true;

  constructor(params: Partial<ConfigType> = {}) {
    super();

    const { debug, containerOptions, worldOptions } = (this.config = {
      ...defaultConfig,
      ...params,
    });

    // debug
    if (debug) {
      this.debug = new Debug(this);
    }

    // container
    this.container = new Container(this, containerOptions);

    // registry
    this.registry = new Registry(this);

    // rendering
    this.rendering = new Rendering(this);

    // inputs
    this.inputs = new Inputs(this);

    // camera
    this.camera = new Camera(this);

    // world
    this.world = new World(this, worldOptions);

    // physics
    this.physics = new Physics(this);

    // time
    this.clock = new Clock();

    this.boot();

    this.emit('ready');
  }

  boot = () => {
    const cycle = () => {
      if (this.debug) {
        this.debug.stats.begin();
      }

      this.tick();
      this.render();

      if (this.debug) {
        this.debug.stats.end();
      }

      requestAnimationFrame(cycle);
    };

    cycle();
  };

  tick = () => {
    if (this.paused) return;

    this.emit('tick-begin');

    this.clock.tick();
    this.physics.tick();
    this.camera.tick();
    this.world.tick();
    this.rendering.tick();

    if (this.debug) {
      this.debug.tick();
    }

    this.emit('tick-end');
  };

  render = () => {
    this.rendering.render();
  };

  start = () => {
    this.paused = false;
    this.emit('start');
  };

  pause = () => {
    this.paused = true;
    this.emit('pause');
  };

  // if pointerlock is locked
  get isLocked() {
    return this.camera.controls.isLocked;
  }
}

export { Engine };
