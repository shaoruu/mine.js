import Engine from '../..';
import { IComponentType } from './componentType';
interface ICollideEntitiesState {
    cylinder: boolean;
    collideBits: number;
    collideMask: number;
    callback: (id: number) => void;
}
/**
 * Every frame, entities with this component will get mutually checked for colliions
 * * cylinder: flag for checking collisions as a vertical cylindar (rather than AABB)
 * * collideBits: category for this entity
 * * collideMask: categories this entity collides with
 * * callback: function(other_id) - called when `own.collideBits & other.collideMask` is true
 *
 * Notes:
 *  Set collideBits=0 for entities like bullets, which can collide with things but are never the target of a collision.
 * 	Set collideMask=0 for things with no callback - things that get collided with, but don't themselves instigate collisions.
 */
export declare function collideEntities(noa: Engine): IComponentType<ICollideEntitiesState>;
export {};
