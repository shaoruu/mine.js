import { EventEmitter } from 'events';
import { Engine } from './engine';
declare type ContainerOptionsType = {
    domElement?: HTMLElement;
    canvas?: HTMLCanvasElement;
};
declare class Container extends EventEmitter {
    engine: Engine;
    domElement: HTMLElement;
    canvas: HTMLCanvasElement;
    constructor(engine: Engine, options: ContainerOptionsType);
    setupCanvas: (options: Partial<ContainerOptionsType>) => void;
    fitCanvas: () => void;
}
export { Container, ContainerOptionsType };
