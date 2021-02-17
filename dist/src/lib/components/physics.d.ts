import Engine from '../..';
import { IComponentType } from './componentType';
interface IPhysicsState {
    body: null;
}
export declare function physics(noa: Engine): IComponentType<IPhysicsState>;
export declare function setPhysicsFromPosition(physState: any, posState: any): void;
export {};
