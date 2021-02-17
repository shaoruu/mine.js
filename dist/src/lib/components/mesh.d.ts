import Engine, { Mesh, Vector } from '../..';
import { IComponentType } from './componentType';
interface IMeshState {
    mesh: Mesh;
    offset: Vector;
}
export declare function mesh(noa: Engine): IComponentType<IMeshState>;
export {};
