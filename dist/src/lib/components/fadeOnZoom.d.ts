import Engine from '../..';
import { IComponentType } from './componentType';
interface IFadeOnZoomState {
    cutoff: number;
    _showing: boolean;
}
/**
 * Component for the player entity, when active hides the player's mesh
 * when camera zoom is less than a certain amount
 */
export declare function fadeOnZoom(noa: Engine): IComponentType<IFadeOnZoomState>;
export {};
