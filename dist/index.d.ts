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
  private tickRate;
  private dragOutsideLock;
  private originRebaseDistance;
  version: string;
  paused: boolean;
  worldOriginOffset: number[];
  positionInCurrentTick: number;
  worldName: string;
  constructor(opts: EngineOptions);
}
export { Engine };
