import Engine from '..';

import { Chunk, _createVoxelArray } from './chunk';
import { StringList, loopForTime, numberOfVoxelsInSphere, makeProfileHook } from './util';

import ndarray from 'ndarray';
import { EventEmitter } from 'events';

let lookIndex = -1;
const PROFILE = 0;
const PROFILE_QUEUES = 0;

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

const defaultWorldOptions: IWorldOptions = {
  chunkSize: 24,
  chunkAddDistance: 3,
  chunkRemoveDistance: 4,
  worldGenWhilePaused: false,
  manuallyControlChunkLoading: false,
};

/**
 * @typicalname noa.world
 * @emits worldDataNeeded(id, ndarray, x, y, z, worldName)
 * @emits chunkAdded(chunk)
 * @emits chunkBeingRemoved(id, ndarray, userData)
 * @description Manages the world and its chunks
 */

export class World<ChunkDataType = any> extends EventEmitter {
  constructor(noa: Engine, options: Partial<IWorldOptions>) {
    super();

    const optionsWidthDefaults = {
      ...defaultWorldOptions,
      ...options,
    };

    this.noa = noa;

    this.playerChunkLoaded = false;
    // this.Chunk = Chunk

    this.chunkSize = optionsWidthDefaults.chunkSize;
    this.chunkAddDistance = optionsWidthDefaults.chunkAddDistance;
    this.chunkRemoveDistance = optionsWidthDefaults.chunkRemoveDistance;
    if (this.chunkRemoveDistance < this.chunkAddDistance) {
      this.chunkRemoveDistance = this.chunkAddDistance;
    }

    // game clients should set this if they need to manually control
    // which chunks to load and unload.
    // when set, client should call noa.world.manuallyLoadChunk / UnloadChunk
    this.manuallyControlChunkLoading = optionsWidthDefaults.manuallyControlChunkLoading;

    // set this higher to cause chunks not to mesh until they have some neighbors
    this.minNeighborsToMesh = 6;

    // settings for tuning worldgen behavior and throughput
    this.maxChunksPendingCreation = 10;
    this.maxChunksPendingMeshing = 10;
    this.maxProcessingPerTick = 9;
    this.maxProcessingPerRender = 5;
    this.worldGenWhilePaused = optionsWidthDefaults.worldGenWhilePaused;

    // set up internal state
    this._cachedWorldName = '';
    this._lastPlayerChunkID = '';
    this._chunkStorage = {};

    this.initChunkQueues();

    // instantiate coord conversion functions based on the chunk size
    // use bit twiddling if chunk size is a power of 2
    const cs = this.chunkSize;
    if ((cs & (cs - 1)) === 0) {
      const shift = Math.log2(cs) | 0;
      const mask = (cs - 1) | 0;
      this._worldCoordToChunkCoord = (coord: number) => (coord >> shift) | 0;
      this._worldCoordToChunkIndex = () => (coord: number) => (coord & mask) | 0;
    } else {
      this._worldCoordToChunkCoord = (coord: number) => Math.floor(coord / cs) | 0;
      this._worldCoordToChunkIndex = () => (coord: number) => ((coord % cs) + cs) % cs | 0;
    }
  }

  /**
   * chunk queues and queue processing
   */
  initChunkQueues = () => {
    // accessor for chunks to queue themselves for remeshing
    this._queueChunkForRemesh = (chunk: any) => {
      this.queueChunkForRemesh(chunk);
    };
  };

  // var chunkHash = ndHash([1024, 1024, 1024])
  _getChunk = (i: number, j: number, k: number) => {
    const id = getChunkID(i, j, k);
    return this._chunkStorage[id] || null;
  };

  _setChunk = (i: number, j: number, k: number, value: Chunk | null) => {
    const id = getChunkID(i, j, k);
    if (value) {
      this._chunkStorage[id] = value;
    } else {
      delete this._chunkStorage[id];
    }
  };

  // chunk accessor for internal use
  _getChunkByCoords = (x: number, y: number, z: number) => {
    const i = this._worldCoordToChunkCoord(x);
    const j = this._worldCoordToChunkCoord(y);
    const k = this._worldCoordToChunkCoord(z);
    return this._getChunk(i, j, k);
  };

  noa: Engine;

  playerChunkLoaded: boolean;
  Chunk: Chunk | undefined;

  chunkSize: number;
  chunkAddDistance: number;
  chunkRemoveDistance: number;

  worldGenWhilePaused: boolean;

  /** set this higher to cause chunks not to mesh until they have some neighbors */
  minNeighborsToMesh = 6;

  manuallyControlChunkLoading: boolean;

  /** settings for tuning worldgen behavior and throughput */
  maxChunksPendingCreation = 10;
  maxChunksPendingMeshing = 10;

  /**
   * milliseconds
   */
  maxProcessingPerTick = 9;

  /**
   * milliseconds
   */
  maxProcessingPerRender = 5;

  /** set up internal state */
  _cachedWorldName = '';
  _lastPlayerChunkID = '';
  _chunkStorage: { [key: string]: Chunk } = {};
  _queueChunkForRemesh: any;

  /** all chunks existing in any queue */
  _chunkIDsKnown = new StringList();

  /** not yet requested from client */
  _chunkIDsToRequest = new StringList();

  /** requested, awaiting creation */
  _chunkIDsPending = new StringList();

  /** created but not yet meshed */
  _chunkIDsToMesh = new StringList();

  /** priority meshing queue */
  _chunkIDsToMeshFirst = new StringList();

  /** chunks awaiting disposal */
  _chunkIDsToRemove = new StringList();

  _worldCoordToChunkCoord = (coord: number) => {
    // instantiate coord conversion functions based on the chunk size
    // use bit twiddling if chunk size is a power of 2
    if ((this.chunkSize & (this.chunkSize - 1)) === 0) {
      const shift = Math.log2(this.chunkSize) | 0;
      return (coord >> shift) | 0;
    } else {
      return Math.floor(coord / this.chunkSize) | 0;
    }
  };

  _worldCoordToChunkIndex = () => {
    // instantiate coord conversion functions based on the chunk size
    // use bit twiddling if chunk size is a power of 2
    if ((this.chunkSize & (this.chunkSize - 1)) === 0) {
      const mask = (this.chunkSize - 1) | 0;
      return (coord: number) => (coord & mask) | 0;
    } else {
      return (coord: number) => ((coord % this.chunkSize) + this.chunkSize) % this.chunkSize | 0;
    }
  };

  getBlockID = (x: number, y: number, z: number) => {
    const chunk = this._getChunkByCoords(x, y, z);
    if (!chunk) return 0;
    return chunk.get(
      this._worldCoordToChunkIndex()(x),
      this._worldCoordToChunkIndex()(y),
      this._worldCoordToChunkIndex()(z),
    );
  };

  getBlockSolidity = (x: number, y: number, z: number) => {
    const chunk = this._getChunkByCoords(x, y, z);
    if (!chunk) return false;
    return !!chunk.getSolidityAt(
      this._worldCoordToChunkIndex()(x),
      this._worldCoordToChunkIndex()(y),
      this._worldCoordToChunkIndex()(z),
    );
  };

  getBlockOpacity = (x: number, y: number, z: number) => {
    const id = this.getBlockID(x, y, z);
    return this.noa.registry.getBlockOpacity(id);
  };

  getBlockFluidity = (x: number, y: number, z: number) => {
    const id = this.getBlockID(x, y, z);
    return this.noa.registry.getBlockFluidity(id);
  };

  getBlockProperties = (x: number, y: number, z: number) => {
    const id = this.getBlockID(x, y, z);
    return this.noa.registry.getBlockProps(id);
  };

  getBlockObjectMesh = (x: number, y: number, z: number) => {
    const chunk = this._getChunkByCoords(x, y, z);
    if (!chunk) {
      return 0;
    }

    return chunk.getObjectMeshAt(
      this._worldCoordToChunkIndex()(x),
      this._worldCoordToChunkIndex()(y),
      this._worldCoordToChunkIndex()(z),
    );
  };

  setBlockID = (val: number, x: number, y: number, z: number) => {
    const i = this._worldCoordToChunkCoord(x);
    const j = this._worldCoordToChunkCoord(y);
    const k = this._worldCoordToChunkCoord(z);
    const ix = this._worldCoordToChunkIndex()(x);
    const iy = this._worldCoordToChunkIndex()(y);
    const iz = this._worldCoordToChunkIndex()(z);

    // logic inside the chunk will trigger a remesh for chunk and
    // any neighbors that need it
    const chunk = this._getChunk(i, j, k);
    if (chunk) {
      chunk.set(ix, iy, iz, val);
    }
  };

  isBoxUnobstructed = (box: any) => {
    const base = box.base;
    const max = box.max;
    for (let i = Math.floor(base[0]); i < max[0] + 1; i++) {
      for (let j = Math.floor(base[1]); j < max[1] + 1; j++) {
        for (let k = Math.floor(base[2]); k < max[2] + 1; k++) {
          if (this.getBlockSolidity(i, j, k)) return false;
        }
      }
    }
    return true;
  };

  /** Tells noa to discard voxel data within a given `AABB` (e.g. because
   * the game client received updated data from a server).
   * The engine will mark all affected chunks for disposal, and will later emit
   * new `worldDataNeeded` events (if the chunk is still in draw range).
   * Note that chunks invalidated this way will not emit a `chunkBeingRemoved` event
   * for the client to save data from.
   */
  invalidateVoxelsInAABB = (box: any) => {
    this.invalidateChunksInBox(box);
  };

  /** invalidate chunks overlapping the given AABB */
  invalidateChunksInBox = (box: any) => {
    const min = box.base.map((n: any) => Math.floor(this._worldCoordToChunkCoord(n)));
    const max = box.max.map((n: any) => Math.floor(this._worldCoordToChunkCoord(n)));
    this._chunkIDsKnown.forEach((id) => {
      const pos = parseChunkID(id);
      for (let i = 0; i < 3; i++) {
        if (pos[i] < min[i] || pos[i] > max[i]) {
          return;
        }
      }
      if (this._chunkIDsToRemove.includes(id)) {
        return;
      }
      this._chunkIDsToRequest.add(id);
    });
  };

  /**
   * internals: tick functions that process queues and trigger events
   */
  tick = () => {
    const tickStartTime = performance.now();

    // if world has changed, mark everything to be removed and re-requested
    if (this._cachedWorldName !== this.noa.worldName) {
      this.markAllChunksForRemoval();
      this._cachedWorldName = this.noa.worldName;
    }

    // current player chunk changed since last tick?
    const pos = this.getPlayerChunkCoords();
    const chunkID = getChunkID(pos[0], pos[1], pos[2]);
    const changedChunks = chunkID != this._lastPlayerChunkID;
    if (changedChunks) {
      this.emit('playerEnteredChunk', pos[0], pos[1], pos[2]);
      this._lastPlayerChunkID = chunkID;
    }
    profile_hook('start');
    profile_queues_hook('start', this);

    // possibly scan for chunks to add/remove
    if (!this.manuallyControlChunkLoading) {
      if (changedChunks) {
        this.findDistantChunksToRemove(pos[0], pos[1], pos[2]);
        profile_hook('remQueue');
      }

      const numChunks = numberOfVoxelsInSphere(this.chunkAddDistance);
      if (changedChunks || this._chunkIDsKnown.count() < numChunks) {
        this.findNewChunksInRange(pos[0], pos[1], pos[2]);
        profile_hook('addQueue');
      }
    }

    // process (create or mesh) some chunks, up to max iteration time
    loopForTime(
      this.maxProcessingPerTick,
      () => {
        let done: any = this.processRequestQueue();
        profile_hook('requests');
        done = done && this.processRemoveQueue();
        profile_hook('removes');
        done = done && this.processMeshingQueue(false);
        profile_hook('meshes');
        return done;
      },
      tickStartTime,
    );

    // when time is left over, look for low-priority extra meshing
    const dt = performance.now() - tickStartTime;
    if (dt + 2 < this.maxProcessingPerTick) {
      this.lookForChunksToMesh();
      profile_hook('looking');
      loopForTime(
        this.maxProcessingPerTick,
        () => {
          const done = this.processMeshingQueue(false);
          profile_hook('meshes');
          return done;
        },
        tickStartTime,
      );
    }

    // track whether the player's local chunk is loaded and ready or not
    const pChunk = this._getChunk(pos[0], pos[1], pos[2]);
    this.playerChunkLoaded = !!pChunk;

    profile_queues_hook('end', this);
    profile_hook('end');
  };

  report = () => {
    console.log('World report - playerChunkLoaded: ', this.playerChunkLoaded);
    this._report('  known:     ', this._chunkIDsKnown.arr, true);
    this._report('  to request:', this._chunkIDsToRequest.arr);
    this._report('  to remove: ', this._chunkIDsToRemove.arr);
    this._report('  creating:  ', this._chunkIDsPending.arr);
    this._report('  to mesh:   ', this._chunkIDsToMesh.arr.concat(this._chunkIDsToMeshFirst.arr));
  };

  _report = (name: string, arr: any[], ext?: any) => {
    let full = 0,
      empty = 0,
      exist = 0,
      surrounded = 0,
      remeshes: any[] = [];

    arr.forEach((id) => {
      const chunk = this._chunkStorage[id];
      if (!chunk) return;
      exist++;
      remeshes.push(chunk._timesMeshed);
      if (chunk.isFull) full++;
      if (chunk.isEmpty) empty++;
      if (chunk._neighborCount === 26) surrounded++;
    });

    let out = arr.length.toString().padEnd(8);
    out += ('exist: ' + exist).padEnd(12);
    out += ('full: ' + full).padEnd(12);
    out += ('empty: ' + empty).padEnd(12);
    out += ('surr: ' + surrounded).padEnd(12);

    if (ext) {
      const sum = remeshes.reduce((acc, val) => acc + val, 0);
      const max = remeshes.reduce((acc, val) => Math.max(acc, val), 0);
      const min = remeshes.reduce((acc, val) => Math.min(acc, val), 0);
      out += 'times meshed: avg ' + (sum / exist).toFixed(2);
      out += '  max ' + max;
      out += '  min ' + min;
    }
    console.log(name, out);
  };

  /**
   * client should call this after creating a chunk's worth of data (as an ndarray)
   *
   * @param reqID
   * @param array data to set into chunk
   * @param userData If userData is passed in it will be attached to the chunk
   */
  setChunkData(reqID: string, array: ndarray<any>, userData?: any) {
    const arr = reqID.split('|');
    const i = parseInt(arr.shift()!);
    const j = parseInt(arr.shift()!);
    const k = parseInt(arr.shift()!);
    const worldName = arr.join('|');
    const id = getChunkID(i, j, k);
    this._chunkIDsPending.remove(id);
    // discard data if it's for a world that's no longer current
    if (worldName !== this.noa.worldName) return;
    // discard if chunk is no longer needed
    if (!this._chunkIDsKnown.includes(id)) return;
    if (this._chunkIDsToRemove.includes(id)) return;
    let chunk = this._chunkStorage[id];
    if (!chunk) {
      // if chunk doesn't exist, create and init
      const size = this.chunkSize;
      chunk = new Chunk(this.noa, id, i, j, k, size, array);
      this._setChunk(i, j, k, chunk);
      chunk.requestID = reqID;
      chunk.userData = userData;
      this.updateNeighborsOfChunk(i, j, k, chunk);
      this.noa.rendering.prepareChunkForRendering(chunk);
      this.emit('chunkAdded', chunk);
    } else {
      // else we're updating data for an existing chunk
      chunk._updateVoxelArray(array);
      // assume neighbors need remeshing
      const list = chunk._neighbors.data;
      list.forEach((nab: any) => {
        if (!nab || nab === chunk) return;
        if (nab._neighborCount > 20) this.queueChunkForRemesh(nab);
      });
    }
    // chunk can now be meshed...
    this.queueChunkForRemesh(chunk);
    profile_queues_hook('receive', this);
  }

  /** similar to above but for chunks waiting to be meshed */
  processMeshingQueue = (firstOnly: boolean) => {
    let queue = this._chunkIDsToMeshFirst;
    if (queue.isEmpty() && !firstOnly) queue = this._chunkIDsToMesh;
    if (queue.isEmpty()) return true;

    const id = queue.pop();
    if (this._chunkIDsToRemove.includes(id)) return;
    const chunk = this._chunkStorage[id];
    if (chunk) this.doChunkRemesh(chunk);
  };

  processRemoveQueue = () => {
    const toRemove = this._chunkIDsToRemove;
    if (toRemove.isEmpty()) return true;
    this.removeChunk(toRemove.pop());
    return toRemove.isEmpty();
  };

  /** sorts a queue of chunk IDs by distance from player (ascending) */
  sortIDListByDistanceFrom = (list: StringList, i: number, j: number, k: number) => {
    list.sort((id) => {
      const pos = parseChunkID(id);
      const dx = pos[0] - i;
      const dy = pos[1] - j;
      const dz = pos[2] - k;

      // bias towards keeping verticals together for now
      return dx * dx + dz * dz + Math.abs(dy);
    });
  };

  getPlayerChunkCoords = () => {
    const pos = this.noa.entities.getPosition(this.noa.playerEntity);
    const i = this._worldCoordToChunkCoord(pos[0]);
    const j = this._worldCoordToChunkCoord(pos[1]);
    const k = this._worldCoordToChunkCoord(pos[2]);
    return [i, j, k];
  };

  /** process neighborhood chunks, add missing ones to "toRequest" and "inMemory" */
  findNewChunksInRange = (ci: number, cj: number, ck: number) => {
    const add = Math.ceil(this.chunkAddDistance);
    const addDistSq = this.chunkAddDistance * this.chunkAddDistance;
    const known = this._chunkIDsKnown;
    const toRequest = this._chunkIDsToRequest;

    // search all nearby chunk locations
    for (let i = ci - add; i <= ci + add; ++i) {
      for (let j = cj - add; j <= cj + add; ++j) {
        for (let k = ck - add; k <= ck + add; ++k) {
          const id = getChunkID(i, j, k);
          if (known.includes(id)) continue;
          const di = i - ci;
          const dj = j - cj;
          const dk = k - ck;
          const distSq = di * di + dj * dj + dk * dk;
          if (distSq > addDistSq) continue;
          known.add(id);
          toRequest.add(id);
        }
      }
    }

    this.sortIDListByDistanceFrom(toRequest, ci, cj, ck);
  };

  /** rebuild queue of chunks to be removed from around (ci,cj,ck) */
  findDistantChunksToRemove = (ci: number, cj: number, ck: number) => {
    const remDistSq = this.chunkRemoveDistance * this.chunkRemoveDistance;
    const toRemove = this._chunkIDsToRemove;
    this._chunkIDsKnown.forEach((id) => {
      if (toRemove.includes(id)) {
        return;
      }

      const loc = parseChunkID(id);
      const di = loc[0] - ci;
      const dj = loc[1] - cj;
      const dk = loc[2] - ck;
      const distSq = di * di + dj * dj + dk * dk;

      if (distSq < remDistSq) {
        return;
      }
      // flag chunk for removal and remove it from work queues
      this._chunkIDsToRemove.add(id);
      this._chunkIDsToRequest.remove(id);
      this._chunkIDsToMesh.remove(id);
      this._chunkIDsToMeshFirst.remove(id);
    });
    this.sortIDListByDistanceFrom(toRemove, ci, cj, ck);
  };

  /** when current world changes - empty work queues and mark all for removal */
  markAllChunksForRemoval = () => {
    this._chunkIDsToRemove.copyFrom(this._chunkIDsKnown);
    this._chunkIDsToRequest.empty();
    this._chunkIDsToMesh.empty();
    this._chunkIDsToMeshFirst.empty();
    const loc = this.getPlayerChunkCoords();
    this.sortIDListByDistanceFrom(this._chunkIDsToRemove, loc[0], loc[1], loc[2]);
  };

  /** incrementally look for chunks that could stand to be re-meshed */
  lookForChunksToMesh = () => {
    const queue = this._chunkIDsKnown.arr;
    const ct = Math.min(50, queue.length);
    let numQueued = this._chunkIDsToMesh.count() + this._chunkIDsToMeshFirst.count();
    for (let i = 0; i < ct; i++) {
      lookIndex = (lookIndex + 1) % queue.length;
      const id = queue[lookIndex];
      const chunk = this._chunkStorage[id];
      if (!chunk) continue;
      const nc = chunk._neighborCount;
      if (nc < this.minNeighborsToMesh) continue;
      if (nc <= chunk._maxMeshedNeighbors) continue;
      this.queueChunkForRemesh(chunk);
      if (++numQueued > 10) return;
    }
  };

  /** run through chunk tracking queues looking for work to do next */
  processRequestQueue = () => {
    const toRequest = this._chunkIDsToRequest;
    if (toRequest.isEmpty()) {
      return true;
    }

    // skip if too many outstanding requests, or if meshing queue is full
    const pending = this._chunkIDsPending.count();
    const toMesh = this._chunkIDsToMesh.count();
    if (pending >= this.maxChunksPendingCreation) return true;
    if (toMesh >= this.maxChunksPendingMeshing) return true;

    const id = toRequest.pop();
    this.requestNewChunk(id);

    return toRequest.isEmpty();
  };

  /**
   * create chunk object and request voxel data from client
   */
  requestNewChunk = (id: string) => {
    const pos = parseChunkID(id);
    const i = pos[0];
    const j = pos[1];
    const k = pos[2];
    const size = this.chunkSize;
    const dataArr = _createVoxelArray(this.chunkSize);
    const worldName = this.noa.worldName;
    const requestID = [i, j, k, worldName].join('|');
    const x = i * size;
    const y = j * size;
    const z = k * size;
    this._chunkIDsPending.add(id);
    this.emit('worldDataNeeded', requestID, dataArr, x, y, z, worldName);
    profile_queues_hook('request', this);
  };

  /** remove a chunk that wound up in the remove queue */
  removeChunk = (id: string) => {
    const loc = parseChunkID(id);
    const chunk = this._getChunk(loc[0], loc[1], loc[2]);
    if (chunk) {
      this.emit('chunkBeingRemoved', chunk.requestID, chunk.voxels, chunk.userData);
      this.noa.rendering.disposeChunkForRendering(chunk);
      chunk.dispose();
      profile_queues_hook('dispose', this);
      this.updateNeighborsOfChunk(loc[0], loc[1], loc[2], null);
    }
    this._setChunk(loc[0], loc[1], loc[2], null);
    this._chunkIDsKnown.remove(id);
    this._chunkIDsToMesh.remove(id);
    this._chunkIDsToMeshFirst.remove(id);
  };

  queueChunkForRemesh = (chunk: any) => {
    const nc = chunk._neighborCount;
    const limit = Math.min(this.minNeighborsToMesh, 26);
    if (nc < limit) return;
    chunk._terrainDirty = true;
    const queue = nc === 26 ? this._chunkIDsToMeshFirst : this._chunkIDsToMesh;

    queue.add(chunk.id);
  };

  doChunkRemesh = (chunk: any) => {
    this._chunkIDsToMesh.remove(chunk.id);
    this._chunkIDsToMeshFirst.remove(chunk.id);
    chunk.updateMeshes();
    profile_queues_hook('mesh', this);
  };

  /** keep neighbor data updated when chunk is added or removed */
  updateNeighborsOfChunk = (ci: any, cj: any, ck: any, chunk: any) => {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        for (let k = -1; k <= 1; k++) {
          if ((i | j | k) === 0) continue;
          const nid = getChunkID(ci + i, cj + j, ck + k);
          const neighbor = this._chunkStorage[nid];
          if (!neighbor) continue;
          if (chunk) {
            chunk._neighborCount++;
            chunk._neighbors.set(i, j, k, neighbor);
            neighbor._neighborCount++;
            neighbor._neighbors.set(-i, -j, -k, chunk);
            // flag for remesh when chunk gets its last neighbor
            if (neighbor._neighborCount === 26) {
              this.queueChunkForRemesh(neighbor);
            }
          } else {
            neighbor._neighborCount--;
            neighbor._neighbors.set(-i, -j, -k, null);
          }
        }
      }
    }
  };

  render = () => {
    // on render, quickly process the high-priority meshing queue
    // to help avoid flashes of background while neighboring chunks update
    loopForTime(this.maxProcessingPerRender, () => this.processMeshingQueue(true));
  };

  /**
   * When manually controlling chunk loading, tells the engine that the chunk containing the specified (x,y,z) needs to be created and loaded.
   *
   * Note: has no effect when `noa.world.manuallyControlChunkLoading` is not set.
   */
  manuallyLoadChunk = (x: number, y: number, z: number) => {
    if (!this.manuallyControlChunkLoading) {
      throw manualErr;
    }

    const i = this._worldCoordToChunkCoord(x);
    const j = this._worldCoordToChunkCoord(y);
    const k = this._worldCoordToChunkCoord(z);
    const id = getChunkID(i, j, k);

    this._chunkIDsKnown.add(id);
    this._chunkIDsToRequest.add(id);
  };

  /**
   * When manually controlling chunk loading, tells the engine that the chunk containing the specified (x,y,z) needs to be unloaded and disposed.
   *
   * Note: has no effect when `noa.world.manuallyControlChunkLoading` is not set.
   */
  manuallyUnloadChunk = (x: any, y: any, z: any) => {
    if (!this.manuallyControlChunkLoading) {
      throw manualErr;
    }

    const i = this._worldCoordToChunkCoord(x);
    const j = this._worldCoordToChunkCoord(y);
    const k = this._worldCoordToChunkCoord(z);
    const id = getChunkID(i, j, k);

    this._chunkIDsToRemove.add(id);
    this._chunkIDsToRequest.remove(id);
    this._chunkIDsToMesh.remove(id);
    this._chunkIDsToMeshFirst.remove(id);
  };
}

const manualErr = 'Set `noa.world.manuallyControlChunkLoading` if you need this API';

/**
 * chunk IDs, storage, and lookup/retrieval
 */
function getChunkID(i: number, j: number, k: number) {
  // chunk coords -> canonical string ID
  return i + '|' + j + '|' + k;
}

function parseChunkID(id: string) {
  // chunk ID -> coords
  return id.split('|').map((s) => parseInt(s));
}

var profile_hook = PROFILE ? makeProfileHook(100, 'world ticks:') : () => {};

type Queues = {
  toreq?: number;
  toget?: number;
  tomesh?: number;
  tomesh1?: number;
  torem?: number;
  request?: number;
  receive?: number;
  mesh?: number;
  dispose?: number;
};

type States = 'start' | 'end' | 'dispose' | 'request' | 'receive' | 'mesh';

var profile_queues_hook = (state: States, world: World): any => {};
if (PROFILE_QUEUES) {
  let iter = 0;
  let counts: { [Key in States]?: number } = {};
  let queues: Queues = {};
  const every = 100;

  let started = performance.now();
  profile_queues_hook = function profile_queues_hook(state: States, world: World) {
    if (state === 'start') return;
    if (state !== 'end') return (counts[state] = (counts[state] || 0) + 1);
    queues.toreq = (queues.toreq || 0) + world._chunkIDsToRequest.count();
    queues.toget = (queues.toget || 0) + world._chunkIDsPending.count();
    queues.tomesh = (queues.tomesh || 0) + world._chunkIDsToMesh.count() + world._chunkIDsToMeshFirst.count();
    queues.tomesh1 = (queues.tomesh1 || 0) + world._chunkIDsToMeshFirst.count();
    queues.torem = (queues.torem || 0) + world._chunkIDsToRemove.count();
    if (++iter < every) return;
    const t = performance.now(),
      dt = t - started;
    const res: any = {};

    // typescript can't figure this key out
    const queueKeys = Object.keys(queues) as (keyof Queues)[];
    queueKeys.forEach((k) => {
      const num = Math.round((queues[k] || 0) / iter);
      res[k] = `[${num}]`.padStart(5);
    });

    // typescript can't figure this key out
    const countKeys = Object.keys(counts) as States[];
    countKeys.forEach((k) => {
      const num = Math.round(((counts[k] || 0) * 1000) / dt);
      res[k] = ('' + num).padStart(3);
    });

    console.log(
      'chunk flow: ',
      `${res.toreq}-> ${res.request} req/s  `,
      `${res.toget}-> ${res.receive} got/s  `,
      `${res.tomesh}-> ${res.mesh} mesh/s  `,
      `${res.torem}-> ${res.dispose} rem/s  `,
      `(meshFirst: ${res.tomesh1!.trim()})`,
    );
    iter = 0;
    counts = {};
    queues = {};
    started = performance.now();
  };
}
