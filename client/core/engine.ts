import { EventEmitter } from 'events';

import merge from 'deepmerge';

import { Clock, DeepPartial } from '../libs';

import { NetworkOptionsType } from '.';
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
  Network,
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
  World,
  WorldOptionsType,
} from '.';

type ConfigType = {
  debug: boolean;
  container: ContainerOptionsType;
  camera: CameraOptionsType;
  chat: ChatOptionsType;
  player: PlayerOptionsType;
  world: WorldOptionsType;
  entities: EntitiesOptionsType;
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
    fov: 75,
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
    acceleration: 1,
    flyingInertia: 3,
    reachDistance: 32,
    lookBlockScale: 1.002,
    lookBlockLerp: 0.7,
    lookBlockColor: '#bbb',
    perspectiveLerpFactor: 0.7,
    perspectiveDistance: 5,
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
    // radius of rendering centered by player
    maxChunkRequestPerFrame: 8,
    // maximum amount of chunks to process per frame tick
    maxChunkProcessPerFrame: 8,
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
  peers: {
    updateInterval: 16, // ms
  },
  network: {
    reconnectInterval: 10000,
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
  public peers: Peers;
  public physics: Physics;
  public entities: Entities;
  public particles: Particles;

  public paused = true;
  public tickSpeed = 0.1;

  constructor(params: DeepPartial<ConfigType> = {}) {
    super();

    const {
      camera,
      chat,
      container,
      debug,
      entities,
      particles,
      peers,
      physics,
      player,
      registry,
      rendering,
      network,
      world,
    } = (this.config = merge(defaultConfig, params));

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

    // physics
    this.physics = new Physics(this, physics);

    // entities
    this.entities = new Entities(this, entities);

    // peers
    this.peers = new Peers(this, peers);

    // particles
    this.particles = new Particles(this, particles);

    // time
    this.clock = new Clock();

    this.boot();

    this.emit('ready');
  }

  join = (worldName: string) => {
    this.network.join(worldName);
    this.start();
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
    if (this.paused || !this.network.connected) return;

    this.emit('tick-begin');

    // pre-ticks for before physics
    this.entities.preTick();

    this.clock.tick();
    this.player.tick();
    this.physics.tick();
    this.entities.tick();
    this.peers.tick();
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
}

export { Engine };
