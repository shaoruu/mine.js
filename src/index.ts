import { EventEmitter } from 'events';

import {
  Camera,
  CameraOptionsType,
  Container,
  ContainerOptionsType,
  Debug,
  Entities,
  EntitiesOptionsType,
  Inputs,
  Physics,
  PhysicsOptionsType,
  Registry,
  RegistryOptionsType,
  Rendering,
  RenderingOptionsType,
  World,
  WorldOptionsType,
} from './app';
import { Clock } from './libs';

type ConfigType = {
  debug: boolean;
  containerOptions: ContainerOptionsType;
  cameraOptions: CameraOptionsType;
  worldOptions: WorldOptionsType;
  entitiesOptions: EntitiesOptionsType;
  physicsOptions: PhysicsOptionsType;
  registryOptions: RegistryOptionsType;
  renderingOptions: RenderingOptionsType;
};

const defaultConfig: ConfigType = {
  debug: true,
  containerOptions: {
    canvas: undefined,
    domElement: document.body,
  },
  cameraOptions: {
    fov: 75,
    near: 0.1,
    far: 8000,
    initPos: [20, 20, 20],
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
    acceleration: 1,
    flyingInertia: 3,
    reachDistance: 32,
    lookBlockScale: 1.02,
    lookBlockLerp: 0.7,
    distToGround: 1.6,
    distToTop: 0.2,
    cameraWidth: 0.8,
  },
  worldOptions: {
    generator: 'sin-cos',
    renderRadius: 5,
    chunkSize: 32,
    chunkPadding: 2,
    dimension: 1,
    // radius of rendering centered by camera
    // maximum amount of chunks to process per frame tick
    maxChunkPerFrame: 2,
    maxLightLevel: 16,
  },
  entitiesOptions: {
    movementLerp: true,
    movementLerpFactor: 0.4,
    maxEntities: 1000,
  },
  physicsOptions: {
    gravity: [0, -24, 0],
    minBounceImpulse: 0.5,
    airDrag: 0.1,
    fluidDrag: 0.4,
    fluidDensity: 2.0,
  },
  registryOptions: {
    textureWidth: 32,
  },
  renderingOptions: {
    fogColor: '#ffffff',
    clearColor: '#b6d2ff',
    directionalLightColor: '#ffffff',
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
  public entities: Entities;

  public paused = true;

  constructor(params: Partial<ConfigType> = {}) {
    super();

    const {
      debug,
      cameraOptions,
      containerOptions,
      entitiesOptions,
      physicsOptions,
      registryOptions,
      renderingOptions,
      worldOptions,
    } = (this.config = {
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
    this.registry = new Registry(this, registryOptions);

    // rendering
    this.rendering = new Rendering(this, renderingOptions);

    // inputs
    this.inputs = new Inputs(this);

    // camera
    this.camera = new Camera(this, cameraOptions);

    // world
    this.world = new World(this, worldOptions);

    // physics
    this.physics = new Physics(this, physicsOptions);

    // entities
    this.entities = new Entities(this, entitiesOptions);

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

    // pre-ticks for before physics
    this.entities.preTick();

    this.clock.tick();
    this.camera.tick();
    this.physics.tick();
    this.entities.tick();
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
