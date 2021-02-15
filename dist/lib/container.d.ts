/// <reference types="node" />
import { Engine } from '..';
import { EventEmitter } from 'events';
declare type ContainerOptions = {
    element: HTMLElement;
    domElement: HTMLElement;
    preventDefaults: boolean;
    pointerLock: boolean;
    tickRate: number;
};
declare class Container extends EventEmitter {
    private tickRate;
    private shell;
    engine: Engine;
    element: HTMLElement;
    canvas: HTMLCanvasElement;
    isFocused: boolean;
    hasPointerLock: boolean;
    supportsPointerLock: boolean;
    pointerInGame: boolean;
    constructor(engine: Engine, opts: Partial<ContainerOptions>);
    getOrCreateCanvas: (element: HTMLElement | undefined) => HTMLCanvasElement;
    createShell: (canvas: HTMLCanvasElement, opts: Partial<ContainerOptions>) => any;
    onLockChange: () => void;
    detectPointerLock: () => void;
    appendTo: (htmlElement: HTMLElement) => void;
    setPointerLock: (lock: any) => void;
    setupTimingEvents: () => void;
}
export default Container;
