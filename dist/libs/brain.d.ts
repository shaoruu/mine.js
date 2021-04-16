import { RigidBody } from './rigid-body';
declare type BrainOptionsType = {
    maxSpeed: number;
    moveForce: number;
    responsiveness: number;
    runningFriction: number;
    standingFriction: number;
    airMoveMult: number;
    jumpImpulse: number;
    jumpForce: number;
    jumpTime: number;
    airJumps: number;
};
declare type BrainStateType = {
    heading: number;
    running: boolean;
    jumping: boolean;
    jumpCount: number;
    isJumping: boolean;
    currentJumpTime: number;
};
declare class Brain {
    body: RigidBody;
    state: BrainStateType;
    options: BrainOptionsType;
    private tempVec;
    private zeroVec;
    private tempVec2;
    constructor(body: RigidBody, state?: Partial<BrainStateType>, options?: Partial<BrainOptionsType>);
    tick(dt: number): void;
}
export { Brain, BrainOptionsType, BrainStateType };
