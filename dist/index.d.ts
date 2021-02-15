/// <reference types="node" />
import Container from './lib/container';
import { EventEmitter } from 'events';
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
declare class Engine extends EventEmitter {
    private tickRate;
    private dragOutsideLock;
    private originRebaseDistance;
    version: string;
    container: Container;
    paused: boolean;
    worldOriginOffset: number[];
    positionInCurrentTick: number;
    worldName: string;
    constructor(opts: EngineOptions);
    tick: () => string;
    render: (dx: number) => number;
}
export { Engine };
