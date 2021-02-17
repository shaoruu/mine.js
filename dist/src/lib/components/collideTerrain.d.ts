import Engine from '../..';
import { IComponentType } from './componentType';
interface ICollideTerrainState {
    callback: (impulse: any, eid: number) => void | null;
}
export declare function collideTerrain(noa: Engine): IComponentType<ICollideTerrainState>;
export {};
