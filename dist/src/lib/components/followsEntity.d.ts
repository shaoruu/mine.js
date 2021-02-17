import Engine, { Vector } from '../..';
import { IComponentType } from './componentType';
interface IFollowsEntityState {
    entity: number;
    offset: Vector | null;
    onTargetMissing: (id: number) => void | null;
}
export declare function followsEntity(noa: Engine): IComponentType<IFollowsEntityState>;
export {};
