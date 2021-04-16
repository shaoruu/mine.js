import { Physics as PhysicsCore, RigidBody } from '../libs';
import { Engine } from './engine';
declare type PhysicsOptionsType = {
    gravity: [number, number, number];
    minBounceImpulse: number;
    airDrag: number;
    fluidDrag: number;
    fluidDensity: number;
};
declare class Physics {
    options: PhysicsOptionsType;
    engine: Engine;
    core: PhysicsCore;
    constructor(engine: Engine, options: PhysicsOptionsType);
    tick(): void;
    getPositionFromRB(rigidBody: RigidBody): number[];
}
export { Physics, PhysicsOptionsType };
