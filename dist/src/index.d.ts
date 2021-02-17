/// <reference types="node" />
import '@babylonjs/core/Meshes/meshBuilder';
import '@babylonjs/core/Meshes/Builders/sphereBuilder';
import '@babylonjs/core/Meshes/Builders/boxBuilder';
import '@babylonjs/core/Meshes/mesh';
import '@babylonjs/core/Materials/standardMaterial';
import { Camera, ICameraOptions } from './lib/camera';
import { Entities, IEntitiesOptions } from './lib/entities';
import { Container, IContainerOptions } from './lib/container';
import { World, IWorldOptions } from './lib/world';
import { IPhysicsOptions } from './lib/physics';
import { IInputOptions } from './lib/inputs';
import { Registry, IRegistryOptions } from './lib/registry';
import { IRenderingOptions, Rendering } from './lib/rendering';
import { GameInputs } from 'game-inputs';
import { EventEmitter } from 'events';
import ndarray from 'ndarray';
export declare type Material = any;
export declare type Mesh = any;
export declare type Scene = any;
declare global {
    interface Window {
        noa: Engine;
        scene: Scene;
        ndarray: ndarray;
        vec3: Vector;
    }
}
export interface IEngineOptions extends Partial<ICameraOptions>, Partial<IEntitiesOptions>, Partial<IContainerOptions>, Partial<IPhysicsOptions>, Partial<IInputOptions>, Partial<IWorldOptions>, Partial<IRegistryOptions>, Partial<IRenderingOptions> {
    /**
     * @default false
     */
    debug: boolean;
    /**
     * @default false
     */
    silent: boolean;
    /**
     * @default 1.8
     */
    playerHeight: number;
    /**
     * @default 0.6
     */
    playerWidth: number;
    /**
     * @default [0, 10, 0]
     */
    playerStart: [number, number, number];
    /**
     * @default false
     */
    playerAutoStep: boolean;
    /**
     * ms per tick - not ticks per second
     * @default 33
     */
    tickRate: number;
    /**
     * ms per tick - not ticks per second
     * @default 10
     */
    blockTestDistance: number;
    /**
     * @default true
     */
    stickyPointerLock: boolean;
    /**
     * @default true
     */
    dragCameraOutsidePointerLock: boolean;
    /**
     * @default false
     */
    skipDefaultHighlighting: boolean;
    /**
     * @default 25
     */
    originRebaseDistance: number;
    /**
     * How many air jumps should be allowed
     * set to 0 to not allow air jumps
     * @default 0
     */
    airJumps: number;
}
export declare type Vector = [number, number, number];
export declare type ArrayTypes = number[] | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Float32Array | Float64Array | Uint8ClampedArray;
declare type Block = {
    /** voxel ID */
    blockID: number;
    /** the (solid) block being targeted */
    position: Vector;
    /** the (non-solid) block adjacent to the targeted one */
    adjacent: Vector;
    /** position of vector when player is targting the top face of a voxel */
    normal: Vector;
};
/**
 * Main engine object.
 * Takes a big options object full of flags and settings as a parameter.
 *
 * ```js
 * const NoaEngine = require('noa-engine')
 * const noa = NoaEngine({
 *  blockTestDistance: 8
 * })
 * ```
 *
 * All option parameters are, well, optional. Note that
 * the root `options` parameter object is also passed to
 * noa's child modules (rendering, camera, etc).
 * See docs for each module for which options they use.
 *
 * @alias Noa
 * @typicalname noa
 * @emits tick(dt)
 * @emits beforeRender(dt)
 * @emits afterRender(dt)
 * @emits targetBlockChanged(blockDesc)
 * @description Root class of the noa engine
 */
declare class Engine extends EventEmitter {
    constructor(options: Partial<IEngineOptions>);
    _paused: boolean;
    _tickRate: number;
    _lastRenderTime: number;
    private _dragOutsideLock;
    private _originRebaseDistance;
    version: string;
    defaultBlockHighlightFunction?: (blockDesc: Block | null) => void;
    /**
     * how far engine is into the current tick. Updated each render
     */
    positionInCurrentTick: number;
    /** world origin offset, used throughout engine for origin rebasing */
    worldOriginOffset: [number, number, number];
    /**
     * vec3 library used throughout the engine
     */
    vec3: any;
    /**
     * container (html/div) manager
     */
    container: Container;
    /**
     * inputs manager - abstracts key/mouse input
     */
    inputs: GameInputs;
    /**
     * Manages camera, view angle, etc.
     */
    camera: Camera;
    /**
     * block/item property registry
     */
    registry: Registry;
    /**
     * world manager
     */
    world: World;
    /**
     * Rendering manager
     */
    rendering: Rendering;
    /**
     * physics engine - solves collisions, properties, etc.
     */
    physics: any;
    /**
     * Entity manager / Entity Component System (ECS)
     * Aliased to `noa.ents` for convenience.
     */
    entities: Entities;
    ents: Entities;
    /**
     * String identifier for the current world. (It's safe to ignore this if
     * your game doesn't need to swap between levels/worlds.)
     */
    worldName: string;
    blockTestDistance: number;
    /**
     * Dynamically updated object describing the currently targeted block.
     * Gets updated each tick, to `null` if no block is targeted, or to an object like
     */
    targetedBlock: Block | null;
    /**
     * function for which block IDs are targetable.
     * Defaults to a solidity check, but can be overridden
     */
    blockTargetIdCheck: (id: number) => boolean;
    playerEntity: number;
    emit: (event: 'tick' | 'beforeRender' | 'afterRender' | 'targetBlockChanged', callback: any) => boolean;
    on: (event: 'tick' | 'beforeRender' | 'afterRender' | 'targetBlockChanged', callback: (dt: any) => void) => this;
    setViewDistance: (dist: number) => void;
    tick: () => void;
    /**
     * Render function, called every animation frame. Emits #beforeRender(dt), #afterRender(dt)
     * where dt is the time in ms *since the last tick*.
     */
    render: (framePart: number) => void;
    /**
     * Precisely converts a world position to the current internal
     * local frame of reference.
     *
     * See `/doc/positions.md` for more info.
     *
     * @param global input position in global coords
     * @param globalPrecise sub-voxel offset to the global position
     * @param local output array which will receive the result
     */
    globalToLocal: (global: Vector, globalPrecise: Vector | null, local: Vector) => Vector;
    /**
     * Precisely converts a world position to the current internal
     * local frame of reference.
     *
     * See `/doc/positions.md` for more info.
     *
     * @param local input array of local coords
     * @param global output array which receives the result
     * @param globalPrecise sub-voxel offset to the output global position
     */
    localToGlobal: (local: number[], global: number[], globalPrecise?: number[] | undefined) => number[];
    /**
     * Pausing the engine will also stop render/tick events, etc.
     * @param paused
     */
    setPaused: (paused: boolean) => void;
    getBlock(position: Vector): number;
    getBlock(x: number, y: number, z: number): number;
    setBlock(id: number, position: Vector): void;
    setBlock(id: number, x: number, y: number, z: number): void;
    /**
     * Adds a block unless obstructed by entities
     */
    addBlock(id: number, position: Vector): number;
    addBlock(id: number, x: number, y: number, z: number): number;
    /**
     * Raycast through the world, returning a result object for any non-air block
     *
     * See `/doc/positions.md` for info on working with precise positions.
     *
     * @param pos (default: to player eye position)
     * @param vec (default: to camera vector)
     * @param dist (default: `noa.blockTestDistance`)
     * @param blockIdTestFunction (default: voxel solidity)
     *
     * @returns null, or an object with array properties: `position`, `normal`, `_localPosition`.
     */
    pick: (pos?: any, vec?: any, dist?: any, blockIdTestFunction?: any) => {
        _localPosition: number[];
        position: number[];
        normal: number[];
    } | null;
    /**
     * Do a raycast in local coords.
     *
     * See `/doc/positions.md` for more info.
     *
     * @param pos
     * @param vec
     * @param dist
     * @param blockIdTestFunction
     */
    _localPick: (pos: number[] | null, vec: any, dist: any, blockIdTestFunction?: ((id: number) => boolean) | undefined) => {
        _localPosition: number[];
        position: number[];
        normal: number[];
    } | null;
    /**
     * rebase world origin offset around the player if necessary
     */
    checkWorldOffset: () => void;
}
export default Engine;
