import { Engine } from '..';
declare type ContainerOptions = {
  domElement?: HTMLElement;
};
declare class Container {
  private shell;
  engine: Engine;
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  hasPointerLock: boolean;
  supportsPointerLock: boolean;
  pointerInGame: boolean;
  isFocused: boolean;
  constructor(engine: Engine, opts?: ContainerOptions);
  getOrCreateCanvas: (element: HTMLElement | undefined) => HTMLCanvasElement;
  lockChange: () => void;
}
declare const _default: (engine: Engine, opts: ContainerOptions) => Container;
export default _default;
