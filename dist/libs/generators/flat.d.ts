import { Chunk, Engine } from '../../app';
import { Generator } from './generator';
declare type FlatGeneratorOptions = {
    height: number;
};
declare class FlatGenerator extends Generator {
    options: FlatGeneratorOptions;
    constructor(engine: Engine, options?: Partial<FlatGeneratorOptions>);
    generate(chunk: Chunk): Promise<void>;
    getVoxelAt(_: number, vy: number): 0 | 1;
}
export { FlatGenerator };
