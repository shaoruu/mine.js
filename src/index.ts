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

class Engine {
  constructor(opts: EngineOptions) {
    opts = { ...defaults, opts } as EngineOptions;
  }
}

export { Engine };
