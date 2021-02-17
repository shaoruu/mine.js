import Engine, { Vector } from '..';
import EntComp from 'ent-comp';
export interface IEntitiesOptions {
    shadowDistance: number;
}
/**
 * @description Wrangles entities. Aliased as `noa.ents`.
 *
 * This class is an instance of [ECS](https://github.com/andyhall/ent-comp),
 * and as such implements the usual ECS methods.
 * It's also decorated with helpers and accessor functions for getting component existence/state.
 *
 * note most APIs are on the original ECS module (ent-comp)
 * these are some overlaid extras for noa
 *
 * Expects entity definitions in a specific format - see source `components` folder for examples.
 */
export declare class Entities extends EntComp {
    constructor(noa: Engine, options: Partial<IEntitiesOptions>);
    noa: Engine;
    /** Hash containing the component names of built-in components. */
    names: {
        collideEntities: string;
        collideTerrain: string;
        fadeOnZoom: string;
        followsEntity: string;
        mesh: string;
        movement: string;
        physics: string;
        position: string;
        receivesInputs: string;
        shadow: string;
        smoothCamera: string;
    };
    getMeshData: any;
    getMovement: any;
    getCollideTerrain: any;
    getCollideEntities: any;
    onPairwiseEntityCollision: any;
    isPlayer(id: number): boolean;
    getPhysics(id: number): {
        __id: number;
        body: any;
    };
    hasPhysics(id: number): boolean;
    cameraSmoothed(id: number): boolean;
    hasMesh(id: number): boolean;
    hasPosition(id: number): boolean;
    getPositionData(id: number): {
        __id: number;
        _localPosition: Vector;
        _renderPosition: Vector;
        _extents: Vector;
        position: Vector;
        height: number;
    };
    _localGetPosition(id: number): any;
    getPosition(id: number): any;
    _localSetPosition(id: number, pos: Vector): void;
    setPosition(id: number, position: Vector): void;
    setPosition(id: number, x: number, y: number, z: number): void;
    setEntitySize(id: number, xs: any, ys: any, zs: any): void;
    /** called when engine rebases its local coords */
    _rebaseOrigin(delta: any): void;
    createComponent: any;
    getPhysicsBody: any;
    hasComponent: any;
    addComponent: any;
    createEntity: any;
    removeComponent: any;
    getStatesList: any;
    /** helper to update everything derived from `_localPosition` */
    updateDerivedPositionData(id: number, posDat: any): void;
    addComponentAgain(id: string, name: string, state?: any): void;
    isTerrainBlocked(x: number, y: number, z: number): boolean;
    getEntitiesInAABB(box: any, withComponent: any): any[];
    /**
     * Helper to set up a general entity, and populate with some common components depending on arguments.
     */
    add(position: any, width: number, height: number, mesh?: any, meshOffset?: any, doPhysics?: boolean, shadow?: any): any;
}
