import ndarray from 'ndarray';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
/**
 * Padded voxel data assembler
 *
 * Takes the chunk of size n, and copies its data into center of an (n+2) ndarray
 * Then copies in edge data from neighbors, or if not available zeroes it out
 * Actual mesher will then run on the padded ndarray
 */
export declare class TerrainMesher {
    constructor(noa: Engine);
    noa: Engine;
    greedyMesher: GreedyMesher;
    meshBuilder: MeshBuilder;
    meshChunk: (chunk: Chunk, matGetter?: ((blockId: number, dir: number) => number[]) | undefined, colGetter?: ((matID: number) => [number, number, number]) | undefined, ignoreMaterials?: boolean | undefined, useAO?: boolean | undefined, aoVals?: [number, number, number] | undefined, revAoVal?: number | undefined) => Mesh | null;
}
/**
 * Submesh - holds one submesh worth of greedy-meshed data
 * Basically, the greedy mesher builds these and the mesh builder consumes them
 */
export declare class Submesh {
    constructor(id: number);
    id: number;
    positions: number[];
    indices: any[];
    normals: number[];
    colors: number[];
    uvs: number[];
    /** flag used during terrain meshing */
    mergeable: boolean;
    renderMat: any;
    dispose: () => void;
}
/**
 * Mesh Builder - turns an array of Submesh data into a
 * Babylon.js mesh/submeshes, ready to be added to the scene
 */
declare class MeshBuilder {
    constructor(noa: Engine);
    noa: Engine;
    materialCache: {
        [key: string]: any;
    };
    build(chunk: Chunk, meshDataList: Submesh[], ignoreMaterials: boolean): Mesh;
    /**
     * given a set of submesh objects, merge some or all of them while tracking vertex/index offsets for each material ID
     * Note: modifies meshDataList in place!
     */
    mergeSubmeshes(meshDataList: Submesh[], mergeAll: boolean): {
        vertices: number[];
        indices: number[];
        matIDs: number[];
    };
    buildMeshFromSubmesh(submesh: Submesh, name: string, mats: Nullable<Material>[], verts: any[], inds: any[]): Mesh;
    getTerrainMaterial(matID: number, ignore: boolean): any;
    makeTerrainMaterial(id: number): any;
}
/**
 * Greedy voxel meshing algorithm
 *    based initially on algo by Mikola Lysenko:
 *    http://0fps.net/2012/07/07/meshing-minecraft-part-2/
 *    but evolved quite a bit since then
 *    AO handling by me, stitched together out of cobwebs and dreams
 *
 * Arguments:
 *    arr: 3D ndarray of dimensions X,Y,Z
 *        packed with solidity/opacity booleans in higher bits
 *    getMaterial: function( blockID, dir )
 *        returns a material ID based on block id and which cube face it is
 *        (assume for now that each mat ID should get its own mesh)
 *    getColor: function( materialID )
 *        looks up a color (3-array) by material ID
 *        TODO: replace this with a lookup array?
 *    doAO: whether or not to bake ambient occlusion into vertex colors
 *    aoValues: array[3] of color multipliers for AO (least to most occluded)
 *    revAoVal: "reverse ao" - color multiplier for unoccluded exposed edges
 *
 *    Return object: array of mesh objects keyed by material ID
 *    arr[id] = {
 *        id: material id for mesh
 *        vertices: ints, range 0 .. X/Y/Z
 *        indices:  ints
 *        normals:  ints,   -1 .. 1
 *        colors:   floats,  0 .. 1
 *        uvs: floats,  0 .. X/Y/Z
 *    }
 */
declare class GreedyMesher {
    constructor(noa: Engine);
    opacityLookup: boolean[];
    solidLookup: boolean[];
    aoPackFunction: null | ((arrT: number[], i: number, iPrev: number, j: number, k: number) => any);
    noa: Engine;
    maskCache: Int16Array;
    aomaskCache: Uint16Array;
    mesh: (voxels: ndarray, getMaterial: any, getColor: any, doAO: any, aoValues: any, revAoVal: any, edgesOnly: boolean) => Submesh[];
    /**
     * Greedy meshing inner loop one
     * iterating across ith 2d plane, with n being index into mask
     */
    constructMeshMasks: (i: any, d: any, arrT: any, getMaterial: any) => void;
    getFaceDir: (id0: number, id1: number, getMaterial: (id: number, materialDir: number) => number, materialDir: number) => 0 | 1 | -1;
    /**
     * Greedy meshing inner loop two
     * construct data for mesh using the masks
     */
    constructMeshDataFromMasks: (i: number, d: number, u: number, v: number, len1: number, len2: number, doAO: any, submeshes: {
        [key: number]: Submesh;
    }, getColor: (id: number) => number[], aoValues: any, revAoVal: any) => void;
    /** Helper functions with AO and non-AO implementations: */
    maskCompare: (index: number, mask: any, maskVal: any, aomask: any, aoVal: any) => boolean;
    maskCompare_noAO: (index: number, mask: any, maskVal: any, aomask: any, aoVal: any) => boolean;
    pushMeshColors_noAO: (colors: Color4, c: number[], ao: any, aoValues: any, revAoVal: any) => boolean;
    pushMeshColors: (colors: number[], c: number[], ao: any, aoValues: any, revAoVal: any) => boolean;
    /**
     * packAOMask:
     *   For a given face, find occlusion levels for each vertex, then
     *   pack 4 such (2-bit) values into one Uint8 value
     *
     * Occlusion levels:
     *    1 is flat ground, 2 is partial occlusion, 3 is max (corners)
     *    0 is "reverse occlusion" - an unoccluded exposed edge
     *
     * Packing order var(bit offset):
     *      a01(2)  -   a11(6)   ^  K
     *        -     -            +> J
     *      a00(0)  -   a10(4)
     *
     * when skipping reverse AO, uses this simpler version of the function:
     */
    packAOMaskNoReverse: (data: any, ipos: any, ineg: any, j: any, k: any) => number;
    packAOMask: (data: any, ipos: any, ineg: any, j: any, k: any) => number;
    unpackAOMask: (aomask: number, jpos: number, kpos: number) => number;
    pushAOColor: (colors: number[], baseCol: number[], ao: any, aoVals: any, revAoVal: any) => void;
}
import Engine, { Material } from '..';
import { Nullable } from '@babylonjs/core';
import { Chunk } from './chunk';
import { Color4 } from './types';
export {};
