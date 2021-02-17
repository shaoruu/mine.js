import Engine from '..';
import { Mesh } from '@babylonjs/core';
import ndarray from 'ndarray';
/**
 * Chunk
 * Stores and manages voxel ids and flags for each voxel within chunk
 */
export declare class Chunk<UserDataType = any> {
    constructor(noa: Engine, id: string, i: number, j: number, k: number, size: number, dataArray: ndarray<any>);
    /** id used by noa */
    id: string;
    /** id sent to game client */
    requestID: string;
    /** data attached to chunk */
    userData: UserDataType | undefined;
    noa: Engine;
    isDisposed: boolean;
    octreeBlock: null | any;
    isEmpty: boolean;
    isFull: boolean;
    /** voxel data and properties */
    voxels: ndarray<any>;
    i: number;
    j: number;
    k: number;
    size: number;
    x: number;
    y: number;
    z: number;
    /** flags to track if things need re-meshing */
    _terrainDirty: boolean;
    _objectsDirty: boolean;
    _terrainMesh: any | null;
    _objectBlocks: any | null;
    _objectSystems: any | null;
    _neighbors: any;
    _neighborCount: number;
    _maxMeshedNeighbors: number;
    _timesMeshed: number;
    _updateVoxelArray: (dataArray: any) => void;
    get: (x: number, y: number, z: number) => any;
    getSolidityAt: (x: number, y: number, z: number) => any;
    set: (x: number, y: number, z: number, newID: number) => void;
    mesh: (matGetter?: ((blockId: number, dir: number) => number[]) | undefined, colGetter?: ((matID: number) => [number, number, number]) | undefined, useAO?: boolean | undefined, aoVals?: [number, number, number] | undefined, revAoVal?: number | undefined) => Mesh | null;
    updateMeshes: () => void;
    dispose: () => void;
    callBlockHandler: (blockID: number, type: 'onUnset' | 'onSet' | 'onLoad' | 'onUnload', x: number, y: number, z: number) => void;
    /**
     * Init
     * Scans voxel data, processing object blocks and setting chunk flags
     */
    scanVoxelData: () => void;
    addObjectBlock: (id: number, x: number, y: number, z: number) => void;
    removeObjectBlock: (x: number, y: number, z: number) => void;
    callAllBlockHandlers: (type: 'onUnset' | 'onSet' | 'onLoad' | 'onUnload') => void;
    getObjectMeshAt: (x: number, y: number, z: number) => never;
}
/** expose logic internally to create and update the voxel data array */
export declare function _createVoxelArray(size: number): ndarray<number>;
