/// <reference types="node" />
import Engine from '..';
import { EventEmitter } from 'events';
export interface IContainerOptions {
    element: HTMLElement;
    domElement: HTMLElement;
    preventDefaults: boolean;
    pointerLock: boolean;
    /**
     * ms per tick - not ticks per second
     * @default 33
     */
    tickRate: number;
}
/**
 * @typicalname noa.container
 * @emits DOMready
 * @description Wraps `game-shell` module and manages HTML container, canvas, etc.
 */
export declare class Container extends EventEmitter {
    constructor(noa: Engine, options: Partial<IContainerOptions>);
    _noa: Engine;
    _tickRate: number;
    element: HTMLElement;
    canvas: HTMLCanvasElement;
    _shell: any;
    hasPointerLock: boolean;
    supportsPointerLock: boolean;
    pointerInGame: boolean;
    isFocused: boolean;
    appendTo: (htmlElement: HTMLElement) => void;
    setPointerLock: (lock: boolean) => void;
    /**
     * INTERNALS
     */
    createContainerDiv: () => HTMLDivElement;
    createShell: (canvas: HTMLCanvasElement, options: Partial<IContainerOptions>) => any;
    /**
     * set up stuff to detect pointer lock support.
     * Needlessly complex because Chrome/Android claims to support but doesn't.
     * For now, just feature detect, but assume no support if a touch event occurs
     * TODO: see if this makes sense on hybrid touch/mouse devices
     */
    detectPointerLock: () => void;
    /** track changes in Pointer Lock state */
    onLockChange: (event: any) => void;
    getOrCreateCanvas: (element: HTMLElement) => HTMLCanvasElement;
    setupTimingEvents: () => void;
}
