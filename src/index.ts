import { EventEmitter } from 'events';

type EngineOptions = {
  debug: boolean;
  silent: boolean;
  playerHeight: number;
  playerWidth: number;
  playerStart: [number, number, number];
  playerAutoStep: boolean;
  tickRate: number;
  blockTestDistance: number;
  stickyPointerLock: boolean;
  dragCameraOutsidePointerLock: boolean;
  skipDefaultHighlighting: boolean;
  originRebaseDistance: number;
};

const defaults: EngineOptions = {
  debug: false,
  silent: false,
  playerHeight: 1.8,
  playerWidth: 0.6,
  playerStart: [0, 10, 0],
  playerAutoStep: false,
  tickRate: 33, // ms per tick - not ticks per second
  blockTestDistance: 10,
  stickyPointerLock: true,
  dragCameraOutsidePointerLock: true,
  skipDefaultHighlighting: false,
  originRebaseDistance: 25,
};

class Engine extends EventEmitter {
  private tickRate: number;
  private dragOutsideLock: boolean;
  private originRebaseDistance: number;

  version: string;

  paused = false;
  worldOriginOffset = [0, 0, 0];
  positionInCurrentTick = 0;
  worldName = 'default';

  constructor(opts: EngineOptions) {
    super();

    this.version = require('../package.json').version;

    opts = { ...defaults, opts } as EngineOptions;

    this.tickRate = opts.tickRate;
    this.dragOutsideLock = opts.dragCameraOutsidePointerLock;

    if (!opts.silent) {
      const debugStr = opts.debug ? ' (debug)' : '';
      console.log(`minejs-engine v${this.version}${debugStr}`);
    }

    // world origin offset, used throughout engine for origin rebasing
    this.originRebaseDistance = opts.originRebaseDistance;
  }
}

export { Engine };
