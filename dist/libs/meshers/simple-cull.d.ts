import { Chunk } from '../../app';
import { MeshResultType } from '../types';
declare function simpleCull(chunk: Chunk): Promise<MeshResultType>;
export { simpleCull };
