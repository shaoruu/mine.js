import Engine from '..';
import { GameInputs, IGameInputOptions } from 'game-inputs';
export interface IInputOptions extends IGameInputOptions {
    bindings: {
        [key: string]: [string] | [string, string] | string;
    };
}
export declare function makeInputs(noa: Engine, options: Partial<IInputOptions>, element: HTMLElement): GameInputs;
