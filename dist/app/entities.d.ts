import { Object3D } from 'three';
import { Brain, EntityType, SmartDictionary } from '../libs';
import { BodyOptionsType } from '../libs/types';
import { Engine } from './engine';
declare type EntitiesOptionsType = {
    movementLerp: boolean;
    movementLerpFactor: number;
    maxEntities: number;
};
declare class Entities {
    options: EntitiesOptionsType;
    engine: Engine;
    list: SmartDictionary<EntityType>;
    constructor(engine: Engine, options: EntitiesOptionsType);
    addEntity(name: string, object: Object3D, size: [number, number, number], offsets?: [number, number, number], options?: Partial<BodyOptionsType>): {
        brain: Brain;
        object: Object3D;
        offsets: [number, number, number];
        body: import("../libs/rigid-body").RigidBody;
    };
    preTick(): void;
    tick(): void;
}
export { Entities, EntitiesOptionsType };
