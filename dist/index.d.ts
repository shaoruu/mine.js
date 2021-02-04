declare type EngineOptions = {
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
declare class Engine {
  constructor(opts: EngineOptions);
}
export { Engine };
