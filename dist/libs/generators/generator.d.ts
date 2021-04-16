import ndarray from 'ndarray';
import { Chunk, Engine } from '../../app';
declare abstract class Generator {
    engine: Engine;
    protected blockTypes: Map<string, number>;
    constructor(engine: Engine);
    abstract generate(chunk: Chunk): Promise<void>;
    useBlockID(name: string): number;
    getBlockID(name: string): number;
    getChunkSize(data: ndarray): number;
}
export { Generator };
