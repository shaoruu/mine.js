import { EventEmitter } from 'events';

import merge from 'deepmerge';

import { Clock, DeepPartial } from '../libs';

import {
  Camera,
  CameraOptionsType,
  Container,
  ContainerOptionsType,
  Debug,
  Entities,
  EntitiesOptionsType,
  Inputs,
  Network,
  Physics,
  PhysicsOptionsType,
  Player,
  PlayerOptionsType,
  Registry,
  RegistryOptionsType,
  Rendering,
  RenderingOptionsType,
  World,
  WorldOptionsType,
} from '.';

type ConfigType = {
  debug: boolean;
  container: ContainerOptionsType;
  camera: CameraOptionsType;
  player: PlayerOptionsType;
  world: WorldOptionsType;
  entities: EntitiesOptionsType;
  physics: PhysicsOptionsType;
  registry: RegistryOptionsType;
  rendering: RenderingOptionsType;
};

const defaultConfig: ConfigType = {
  debug: true,
  container: {
    canvas: undefined,
    domElement: undefined,
  },
  camera: {
    fov: 75,
    near: 0.1,
    far: 8000,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
  },
  player: {
    acceleration: 1,
    flyingInertia: 3,
    reachDistance: 32,
    lookBlockScale: 1.002,
    lookBlockLerp: 0.7,
    lookBlockColor: '#bbb',
    distToGround: 1.6,
    distToTop: 0.2,
    bodyWidth: 0.6,
  },
  world: {
    maxHeight: 128,
    renderRadius: 12,
    requestRadius: 14,
    chunkSize: 8,
    dimension: 1,
    // radius of rendering centered by camera
    // maximum amount of chunks to process per frame tick
    maxChunkRequestPerFrame: 8,
    maxChunkProcessPerFrame: 16,
    maxBlockPerFrame: 500,
  },
  entities: {
    movementLerp: true,
    movementLerpFactor: 0.4,
    maxEntities: 1000,
  },
  physics: {
    gravity: [0, -24, 0],
    minBounceImpulse: 0.5,
    airDrag: 0.1,
    fluidDrag: 0.4,
    fluidDensity: 2.0,
  },
  registry: {
    textureWidth: 32,
  },
  rendering: {
    // fogColor: '#fff',
    // fogNearColor: '#eee',
    // clearColor: '#b6d2ff',
    fogColor: '#222',
    fogNearColor: '#333',
    clearColor: '#123',
  },
};

class Engine extends EventEmitter {
  public config: ConfigType;
  public debug: Debug;
  public clock: Clock;
  public network: Network;
  public container: Container;
  public rendering: Rendering;
  public inputs: Inputs;
  public camera: Camera;
  public registry: Registry;
  public world: World;
  public player: Player;
  public physics: Physics;
  public entities: Entities;

  public paused = true;

  constructor(worldName: string, params: DeepPartial<ConfigType> = {}) {
    super();

    const { camera, container, debug, entities, physics, player, registry, rendering, world } = (this.config = merge(
      defaultConfig,
      params,
    ));

    // debug
    if (debug) {
      this.debug = new Debug(this);
    }

    // network
    this.network = new Network(this, worldName);

    // container
    this.container = new Container(this, container);

    // rendering
    this.rendering = new Rendering(this, rendering);

    // registry
    this.registry = new Registry(this, registry);

    // inputs
    this.inputs = new Inputs(this);

    // camera
    this.camera = new Camera(this, camera);

    // world
    this.world = new World(this, world);

    // player
    this.player = new Player(this, player);

    // physics
    this.physics = new Physics(this, physics);

    // entities
    this.entities = new Entities(this, entities);

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
    if (this.paused || !this.network.connected) return;

    this.emit('tick-begin');

    // pre-ticks for before physics
    this.entities.preTick();

    this.clock.tick();
    this.player.tick();
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

  lock = () => {
    this.player.controls.lock();
  };

  unlock = () => {
    this.player.controls.unlock();
  };

  // if pointerlock is locked
  get locked() {
    return this.player.controls.isLocked;
  }
}

export { Engine };
