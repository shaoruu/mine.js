import { EventEmitter } from 'events';

import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three';

import { Camera, Container, Debug, Registry, Rendering, World } from './app';
import { Clock } from './libs';

type ConfigType = {
  domElement?: HTMLElement;
};

const defaultConfig: ConfigType = {
  domElement: document.body,
};

class Engine extends EventEmitter {
  public config: ConfigType;
  public debug: Debug;
  public clock: Clock;
  public container: Container;
  public rendering: Rendering;
  public camera: Camera;
  public registry: Registry;
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

    // registry
    this.registry = new Registry(this);

    // rendering
    this.rendering = new Rendering(this);

    // camera
    this.camera = new Camera(this);

    // world
    this.world = new World(this);

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
    this.clock.tick();
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
