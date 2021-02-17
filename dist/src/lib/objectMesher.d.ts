import { Chunk } from './chunk';
import { SolidParticleSystem } from '@babylonjs/core/Particles/solidParticleSystem';
/** helper class to hold data about a single object mesh */
export declare class ObjMeshDat {
    constructor(id: number, x: number, y: number, z: number);
    id: number;
    x: number;
    y: number;
    z: number;
}
/**
 * Object meshing
 * Per-chunk handling of the creation/disposal of voxels with static meshes
 */
/** adds properties to the new chunk that will be used when processing */
export declare function initChunk(chunk: Chunk): void;
export declare function disposeChunk(chunk: Chunk): void;
/** accessors for the chunk to regester as object voxels are set/unset */
export declare function addObjectBlock(chunk: Chunk, id: number, x: number, y: number, z: number): void;
export declare function removeObjectBlock(chunk: Chunk, x: number, y: number, z: number): void;
/**
 * main implementation - remove / rebuild all needed object mesh instances
 */
export declare function removeObjectMeshes(chunk: Chunk): void;
export declare function buildObjectMeshes(chunk: Chunk): import("@babylonjs/core").Mesh[];
export declare function buildSPSforMaterialIndex(chunk: Chunk, scene: any, meshHash: any, x0: number, y0: number, z0: number): SolidParticleSystem;
