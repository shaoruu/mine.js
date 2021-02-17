import Engine from '..';
export interface IPhysicsOptions {
    gravity: [number, number, number];
    airDrag: number;
}
/**
 * @class Physics
 * @typicalname noa.physics
 * @description Wrapper module for the physics engine. For docs see [andyhall/voxel-physics-engine](https://github.com/andyhall/voxel-physics-engine)
 */
export declare function makePhysics(noa: Engine, options: Partial<IPhysicsOptions>): any;
