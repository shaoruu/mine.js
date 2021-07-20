import { EventEmitter } from 'events';

import TWEEN from '@tweenjs/tween.js';
import merge from 'deepmerge';

import { Clock, DeepPartial } from '../libs';

import {
  Camera,
  CameraOptionsType,
  Chat,
  ChatOptionsType,
  Container,
  ContainerOptionsType,
  Debug,
  Entities,
  EntitiesOptionsType,
  Inputs,
  Inventory,
  InventoryOptionsType,
  Network,
  NetworkOptionsType,
  Particles,
  ParticlesOptionsType,
  Peers,
  PeersOptionsType,
  Physics,
  PhysicsOptionsType,
  Player,
  PlayerOptionsType,
  Registry,
  RegistryOptionsType,
  Rendering,
  RenderingOptionsType,
  Shadows,
  ShadowsOptionsType,
  World,
  WorldOptionsType,
} from '.';

type ConfigType = {
  debug: boolean;
  container: ContainerOptionsType;
  camera: CameraOptionsType;
  chat: ChatOptionsType;
  player: PlayerOptionsType;
  inventory: InventoryOptionsType;
  world: WorldOptionsType;
  entities: EntitiesOptionsType;
  shadows: ShadowsOptionsType;
  physics: PhysicsOptionsType;
  registry: RegistryOptionsType;
  rendering: RenderingOptionsType;
  peers: PeersOptionsType;
  network: NetworkOptionsType;
  particles: ParticlesOptionsType;
};

const defaultConfig: ConfigType = {
  debug: true,
  container: {
    canvas: undefined,
    domElement: undefined,
  },
  camera: {
    fov: 90,
    near: 0.1,
    far: 8000,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
  },
  chat: {
    margin: 8,
    disappearTimeout: 2000,
  },
  player: {
    acceleration: 0.6,
    flyingInertia: 3,
    reachDistance: 32,
    lookBlockScale: 1.002,
    lookBlockLerp: 1,
    lookBlockColor: 'black',
    perspectiveLerpFactor: 0.7,
    perspectiveDistance: 5,
    distToGround: 1.6,
    distToTop: 0.2,
    bodyWidth: 0.6,
  },
  inventory: {
    backpackColumns: 10,
    backpackRows: 5,
    hotbarSlots: 6,
  },
  world: {
    renderRadius: 6,
    requestRadius: 8,
    // maximum amount of chunks to process per frame tick
    maxChunkProcessPerFrame: 16,
    maxBlockPerFrame: 500,
    chunkAnimation: true,
    animationTime: 500,
  },
  entities: {
    movementLerp: true,
    movementLerpFactor: 0.4,
    maxEntities: 1000000,
    maxProcessPerFrame: 16,
  },
  shadows: {
    maxRadius: 0.4,
    maxDist: 5,
  },
  physics: {
    gravity: [0, -24, 0],
    minBounceImpulse: 0.5,
    airDrag: 0.1,
    fluidDrag: 0.4,
    fluidDensity: 2.0,
  },
  registry: {
    resolution: 500,
    focusDist: 5,
    focusBlockSize: 5.5,
    focusPlantSize: 8,
  },
  rendering: {
    // fogColor: '#fff',
    // fogNearColor: '#eee',
    // clearColor: '#b6d2ff',
    fogColor: '#222',
    fogNearColor: '#333',
    clearColor: '#123',
  },
  peers: {
    updateInterval: 16, // ms
  },
  network: {
    reconnectTimeout: 5000,
  },
  particles: {
    count: 10,
  },
};

class Engine extends EventEmitter {
  public config: ConfigType;
  public debug: Debug;
  public clock: Clock;
  public chat: Chat;
  public network: Network;
  public container: Container;
  public rendering: Rendering;
  public inputs: Inputs;
  public camera: Camera;
  public registry: Registry;
  public world: World;
  public player: Player;
  public inventory: Inventory;
  public peers: Peers;
  public physics: Physics;
  public entities: Entities;
  public shadows: Shadows;
  public particles: Particles;

  public paused = true;
  public tickSpeed = 0.1;
  public started = false;

  // TODO: make a loader?
  public texturesLoaded = false;
  public entitiesLoaded = false;
  public assetsLoaded = false;

  constructor(worldData, params: DeepPartial<ConfigType> = {}) {
    super();

    this.config = merge(defaultConfig, params);

    this.load(worldData);

    const {
      camera,
      chat,
      container,
      debug,
      entities,
      shadows,
      particles,
      peers,
      physics,
      player,
      inventory,
      registry,
      rendering,
      network,
      world,
    } = this.config;

    // debug
    if (debug) {
      this.debug = new Debug(this);
    }

    // network
    this.network = new Network(this, network);

    // container
    this.container = new Container(this, container);

    // rendering
    this.rendering = new Rendering(this, rendering);

    // registry
    this.registry = new Registry(this, registry);

    // inputs
    this.inputs = new Inputs(this);

    // chat
    this.chat = new Chat(this, chat);

    // camera
    this.camera = new Camera(this, camera);

    // world
    this.world = new World(this, world);

    // player
    this.player = new Player(this, player);

    // inventory
    this.inventory = new Inventory(this, inventory);

    // physics
    this.physics = new Physics(this, physics);

    // entities
    this.entities = new Entities(this, entities);

    // shadows
    this.shadows = new Shadows(this, shadows);

    // peers
    this.peers = new Peers(this, peers);

    // particles
    this.particles = new Particles(this, particles);

    // time
    this.clock = new Clock();

    this.boot();

    this.emit('ready');

    this.on('focus-loaded', () => {
      this.texturesLoaded = true;
      if (this.entitiesLoaded) this.assetsLoaded = true;
    });
    this.on('entities-loaded', () => {
      this.entitiesLoaded = true;
      if (this.texturesLoaded) this.assetsLoaded = true;
    });
  }

  load = (worldData) => {
    const { world, registry, entities } = this.config;
    const {
      chunkSize,
      dimension,
      maxHeight,
      subChunks,
      name,
      blocks,
      ranges,
      uvSideCount,
      uvTextureSize,
      entities: prototypes,
    } = worldData;

    entities.prototypes = prototypes;

    registry.blocks = blocks;
    registry.ranges = ranges;
    registry.countPerSide = uvSideCount;
    registry.textureSize = uvTextureSize;

    world.name = name;
    world.chunkSize = chunkSize;
    world.dimension = dimension;
    world.maxHeight = maxHeight;
    world.subChunks = subChunks;
  };

  boot = () => {
    const cycle = () => {
      this.tick();
      this.render();

      requestAnimationFrame(cycle);
    };

    cycle();
  };

  tick = () => {
    if (this.paused || !this.network.connected || !this.started) return;

    this.emit('tick-begin');

    // TWEEN animations

    // pre-ticks for before physics
    this.entities.preTick();

    this.clock.tick();
    this.camera.tick();
    this.player.tick();
    this.physics.tick();
    this.entities.tick();
    this.shadows.tick();
    this.particles.tick();
    this.peers.tick();
    this.world.tick();
    this.rendering.tick();

    TWEEN.update();

    if (this.debug) {
      this.debug.tick();
    }

    this.emit('tick-end');
  };

  render = () => {
    if (!this.started) return;

    this.rendering.render();
  };

  start = () => {
    this.paused = false;
    this.started = true;
    this.emit('start');
  };

  pause = () => {
    this.paused = true;
    this.emit('pause');
  };

  lock = (cb?: () => void) => {
    this.player.controls.lock(cb);
  };

  unlock = (cb?: () => void) => {
    this.player.controls.unlock(cb);
  };

  setTick = (speed: number, sideEffect = true) => {
    this.tickSpeed = speed;

    if (sideEffect)
      this.rendering.engine.network.server.sendEvent({
        type: 'CONFIG',
        json: {
          tickSpeed: this.tickSpeed,
        },
      });
  };

  // if pointerlock is locked
  get locked() {
    return this.player.controls.isLocked;
  }

  get connected() {
    return this.network.connected;
  }

  get loadPercentage() {
    return Object.keys(this.registry.focuses).length / this.registry.options.blocks.length;
  }
}

export { Engine };
