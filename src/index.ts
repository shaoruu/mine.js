import { EventEmitter } from 'events';

import { Camera, Container, Debug, Inputs, Registry, Rendering, World } from './app';
import { Clock, GeneratorType } from './libs';

type ConfigType = {
  canvas?: HTMLCanvasElement;
  domElement: HTMLElement;
  generator: GeneratorType;
  renderRadius: number;
};

const defaultConfig: ConfigType = {
  domElement: document.body,
  generator: '',
  renderRadius: 4,
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

  public paused = true;

  constructor(params: Partial<ConfigType> = {}) {
    super();

    const { canvas, domElement, generator, renderRadius } = (this.config = {
      ...defaultConfig,
      ...params,
    });

    // debug
    this.debug = new Debug(this);

    // container
    this.container = new Container(this, {
      canvas,
      domElement,
    });

    // registry
    this.registry = new Registry(this);

    // rendering
    this.rendering = new Rendering(this);

    // inputs
    this.inputs = new Inputs(this);

    // camera
    this.camera = new Camera(this);

    // world
    this.world = new World(this, {
      generator,
      renderRadius,
    });

    this.clock = new Clock();

    this.boot();

    // this.rendering.scene.add(
    //   new Mesh(
    //     new SphereGeometry(10, 10, 10),
    //     new MeshStandardMaterial({
    //       map: this.registry.textureMerger.mergedTexture,
    //     }),
    //   ),
    // );

    this.emit('ready');
  }

  boot = () => {
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
    if (this.paused) return;

    this.emit('tick-begin');

    this.clock.tick();
    this.camera.tick();
    this.world.tick();
    this.rendering.tick();
    this.debug.tick();

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
