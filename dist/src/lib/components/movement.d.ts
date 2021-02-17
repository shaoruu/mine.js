import Engine from '../..';
import { IComponentType } from './componentType';
interface IMovementState {
    /** radians */
    heading: number;
    running: boolean;
    jumping: boolean;
    maxSpeed: number;
    moveForce: number;
    responsiveness: number;
    runningFriction: number;
    standingFriction: number;
    airMoveMult: number;
    jumpImpulse: number;
    jumpForce: number;
    /** ms */
    jumpTime: number;
    airJumps: number;
    _jumpCount: number;
    _isJumping: boolean;
    _currjumptime: number;
}
/**
 * Movement component. State stores settings like jump height, etc.,
 * as well as current state (running, jumping, heading angle).
 * Processor checks state and applies movement/friction/jump forces
 * to the entity's physics body.
 */
export declare function movement(noa: Engine): IComponentType<IMovementState>;
export {};
