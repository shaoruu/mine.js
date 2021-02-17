/// <reference types="node" />
import Engine from '..';
import { Chunk } from './chunk';
import { StringList } from './util';
import ndarray from 'ndarray';
import { EventEmitter } from 'events';
export interface IWorldOptions {
    /**
     * @default 24
     */
    chunkSize: number;
    /**
     * @default 3
     */
    chunkAddDistance: number;
    /**
     * @default 4
     */
    chunkRemoveDistance: number;
    /**
     * @default false
     */
    worldGenWhilePaused: boolean;
    /**
     * @default false
     */
    manuallyControlChunkLoading: boolean;
}
/**
 * @typicalname noa.world
 * @emits worldDataNeeded(id, ndarray, x, y, z, worldName)
 * @emits chunkAdded(chunk)
 * @emits chunkBeingRemoved(id, ndarray, userData)
 * @description Manages the world and its chunks
 */
export declare class World<ChunkDataType = any> extends EventEmitter {
    constructor(noa: Engine, options: Partial<IWorldOptions>);
    /**
     * chunk queues and queue processing
     */
    initChunkQueues: () => void;
    _getChunk: (i: number, j: number, k: number) => Chunk<any>;
    _setChunk: (i: number, j: number, k: number, value: Chunk | null) => void;
    _getChunkByCoords: (x: number, y: number, z: number) => Chunk<any>;
    noa: Engine;
    playerChunkLoaded: boolean;
    Chunk: Chunk | undefined;
    chunkSize: number;
    chunkAddDistance: number;
    chunkRemoveDistance: number;
    worldGenWhilePaused: boolean;
    /** set this higher to cause chunks not to mesh until they have some neighbors */
    minNeighborsToMesh: number;
    manuallyControlChunkLoading: boolean;
    /** settings for tuning worldgen behavior and throughput */
    maxChunksPendingCreation: number;
    maxChunksPendingMeshing: number;
    /**
     * milliseconds
     */
    maxProcessingPerTick: number;
    /**
     * milliseconds
     */
    maxProcessingPerRender: number;
    /** set up internal state */
    _cachedWorldName: string;
    _lastPlayerChunkID: string;
    _chunkStorage: {
        [key: string]: Chunk;
    };
    _queueChunkForRemesh: any;
    /** all chunks existing in any queue */
    _chunkIDsKnown: StringList;
    /** not yet requested from client */
    _chunkIDsToRequest: StringList;
    /** requested, awaiting creation */
    _chunkIDsPending: StringList;
    /** created but not yet meshed */
    _chunkIDsToMesh: StringList;
    /** priority meshing queue */
    _chunkIDsToMeshFirst: StringList;
    /** chunks awaiting disposal */
    _chunkIDsToRemove: StringList;
    _worldCoordToChunkCoord: (coord: number) => number;
    _worldCoordToChunkIndex: () => (coord: number) => number;
    getBlockID: (x: number, y: number, z: number) => any;
    getBlockSolidity: (x: number, y: number, z: number) => boolean;
    getBlockOpacity: (x: number, y: number, z: number) => boolean;
    getBlockFluidity: (x: number, y: number, z: number) => boolean;
    getBlockProperties: (x: number, y: number, z: number) => import("./registry").IBlockProps;
    getBlockObjectMesh: (x: number, y: number, z: number) => number;
    setBlockID: (val: number, x: number, y: number, z: number) => void;
    isBoxUnobstructed: (box: any) => boolean;
    /** Tells noa to discard voxel data within a given `AABB` (e.g. because
     * the game client received updated data from a server).
     * The engine will mark all affected chunks for disposal, and will later emit
     * new `worldDataNeeded` events (if the chunk is still in draw range).
     * Note that chunks invalidated this way will not emit a `chunkBeingRemoved` event
     * for the client to save data from.
     */
    invalidateVoxelsInAABB: (box: any) => void;
    /** invalidate chunks overlapping the given AABB */
    invalidateChunksInBox: (box: any) => void;
    /**
     * internals: tick functions that process queues and trigger events
     */
    tick: () => void;
    report: () => void;
    _report: (name: string, arr: any[], ext?: any) => void;
    /**
     * client should call this after creating a chunk's worth of data (as an ndarray)
     *
     * @param reqID
     * @param array data to set into chunk
     * @param userData If userData is passed in it will be attached to the chunk
     */
    setChunkData(reqID: string, array: ndarray<any>, userData?: any): void;
    /** similar to above but for chunks waiting to be meshed */
    processMeshingQueue: (firstOnly: boolean) => true | undefined;
    processRemoveQueue: () => boolean;
    /** sorts a queue of chunk IDs by distance from player (ascending) */
    sortIDListByDistanceFrom: (list: StringList, i: number, j: number, k: number) => void;
    getPlayerChunkCoords: () => number[];
    /** process neighborhood chunks, add missing ones to "toRequest" and "inMemory" */
    findNewChunksInRange: (ci: number, cj: number, ck: number) => void;
    /** rebuild queue of chunks to be removed from around (ci,cj,ck) */
    findDistantChunksToRemove: (ci: number, cj: number, ck: number) => void;
    /** when current world changes - empty work queues and mark all for removal */
    markAllChunksForRemoval: () => void;
    /** incrementally look for chunks that could stand to be re-meshed */
    lookForChunksToMesh: () => void;
    /** run through chunk tracking queues looking for work to do next */
    processRequestQueue: () => boolean;
    /**
     * create chunk object and request voxel data from client
     */
    requestNewChunk: (id: string) => void;
    /** remove a chunk that wound up in the remove queue */
    removeChunk: (id: string) => void;
    queueChunkForRemesh: (chunk: any) => void;
    doChunkRemesh: (chunk: any) => void;
    /** keep neighbor data updated when chunk is added or removed */
    updateNeighborsOfChunk: (ci: any, cj: any, ck: any, chunk: any) => void;
    render: () => void;
    /**
     * When manually controlling chunk loading, tells the engine that the chunk containing the specified (x,y,z) needs to be created and loaded.
     *
     * Note: has no effect when `noa.world.manuallyControlChunkLoading` is not set.
     */
    manuallyLoadChunk: (x: number, y: number, z: number) => void;
    /**
     * When manually controlling chunk loading, tells the engine that the chunk containing the specified (x,y,z) needs to be unloaded and disposed.
     *
     * Note: has no effect when `noa.world.manuallyControlChunkLoading` is not set.
     */
    manuallyUnloadChunk: (x: any, y: any, z: any) => void;
}
