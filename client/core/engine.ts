import { EventEmitter } from 'events';

import merge from 'deepmerge';
import { ShaderChunk } from 'three';

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
  NetworkOptionsType,
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

ShaderChunk.fog_pars_vertex = ShaderChunk.fog_pars_vertex.replace(
  'varying float fogDepth;',
  'varying vec3 vViewPosition;',
);

ShaderChunk.fog_vertex = ShaderChunk.fog_vertex.replace(
  'fogDepth = - mvPosition.z;',
  'vViewPosition = - mvPosition.xyz;',
);

ShaderChunk.fog_pars_fragment = ShaderChunk.fog_pars_fragment.replace(
  'varying float fogDepth;',
  'varying vec3 vViewPosition;',
);

ShaderChunk.fog_fragment = ShaderChunk.fog_fragment
  .replace('#ifdef USE_FOG', ['#ifdef USE_FOG', '  float fogDepth = length(vViewPosition);'].join('\n'))
  .replace(
    'float fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogDepth * fogDepth );',
    [
      '#ifdef FOG_DENSITY',
      '  float fogFactor = 1.0 - exp( - FOG_DENSITY * FOG_DENSITY * fogDepth * fogDepth );',
      '#else',
      '  float fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogDepth * fogDepth );',
      '#endif',
    ].join('\n'),
  );

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
  network: NetworkOptionsType;
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
    lookBlockScale: 1,
    lookBlockLerp: 0.9,
    lookBlockColor: '#333',
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
  network: {
    url: `http://${window.location.hostname}${
      window.location.hostname === 'localhost' ? ':4000' : window.location.port ? `:${window.location.port}` : ''
    }`,
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

  constructor(params: DeepPartial<ConfigType> = {}) {
    super();

    const {
      camera,
      container,
      debug,
      entities,
      network,
      physics,
      player,
      registry,
      rendering,
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

  // if pointerlock is locked
  get isLocked() {
    return this.player.controls.isLocked;
  }
}

export { Engine };
