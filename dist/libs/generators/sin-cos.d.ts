import { Chunk, Engine } from '../../app';
import { Generator } from './generator';
declare class SinCosGenerator extends Generator {
    constructor(engine: Engine);
    generate(chunk: Chunk): Promise<void>;
}
export { SinCosGenerator };
