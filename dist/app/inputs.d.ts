import { SmartDictionary } from '../libs';
import { Engine } from './engine';
declare class Inputs {
    engine: Engine;
    combos: SmartDictionary<string>;
    callbacks: SmartDictionary<() => void>;
    constructor(engine: Engine);
    add(name: string, combo: string): void;
    bind(name: string, callback: () => void): void;
    unbind(name: string): void;
}
export { Inputs };
