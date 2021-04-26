import { EventEmitter } from 'events';

import { Coords2, Coords3 } from '../../shared';
import { ServerChunkType } from '../libs';
import { Helper } from '../utils';

import { Chunk } from './chunk';
import { Engine } from './engine';

type WorldOptionsType = {
  maxHeight: number;
  chunkSize: number;
  dimension: number;
  renderRadius: number;
  requestRadius: number;
  maxChunkRequestPerFrame: number;
  maxChunkProcessPerFrame: number;
  maxBlockPerFrame: number;
};

class World extends EventEmitter {
  public isReady = false;

  private camChunkName: string;
  private camChunkPos: Coords2;

  private pendingChunks: Coords2[] = [];
  private requestedChunks: Set<string> = new Set();
  private receivedChunks: ServerChunkType[] = [];
  private chunks: Map<string, Chunk> = new Map();
  private visibleChunks: Chunk[] = [];

  constructor(public engine: Engine, public options: WorldOptionsType) {
    super();
  }

  tick() {
    this.checkCamChunk();
    this.requestChunks();
    this.meshChunks();
  }

  getChunkByCPos(cCoords: Coords2) {
    return this.getChunkByName(Helper.getChunkName(cCoords));
  }

  getChunkByName(chunkName: string) {
    return this.chunks.get(chunkName);
  }

  getChunkByVoxel(vCoords: Coords3) {
    const { chunkSize } = this.options;
    const chunkCoords = Helper.mapVoxelPosToChunkPos(vCoords, chunkSize);
    return this.getChunkByCPos(chunkCoords);
  }

  getNeighborChunksByVoxel(vCoords: Coords3, padding = 0) {
    const { chunkSize } = this.options;
    const chunk = this.getChunkByVoxel(vCoords);
    const [cx, cz] = Helper.mapVoxelPosToChunkPos(vCoords, chunkSize);
    const [lx, , lz] = Helper.mapVoxelPosToChunkLocalPos(vCoords, chunkSize);
    const neighborChunks: (Chunk | null)[] = [];

    // check if local position is on the edge
    // TODO: fix this hacky way of doing so.
    const a = lx < padding;
    const b = lz < padding;
    const c = lx >= chunkSize - padding;
    const d = lz >= chunkSize - padding;

    // direct neighbors
    if (a) neighborChunks.push(this.getChunkByCPos([cx - 1, cz]));
    if (b) neighborChunks.push(this.getChunkByCPos([cx, cz - 1]));
    if (c) neighborChunks.push(this.getChunkByCPos([cx + 1, cz]));
    if (d) neighborChunks.push(this.getChunkByCPos([cx, cz + 1]));

    // side-to-side diagonals
    if (a && b) neighborChunks.push(this.getChunkByCPos([cx - 1, cz - 1]));
    if (a && d) neighborChunks.push(this.getChunkByCPos([cx - 1, cz + 1]));
    if (b && c) neighborChunks.push(this.getChunkByCPos([cx + 1, cz - 1]));
    if (c && d) neighborChunks.push(this.getChunkByCPos([cx + 1, cz + 1]));

    return neighborChunks.filter(Boolean).filter((c) => c !== chunk);
  }

  getVoxelByVoxel(vCoords: Coords3) {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk ? chunk.getVoxel(...vCoords) : null;
  }

  getVoxelByWorld(wCoords: Coords3) {
    const vCoords = Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
    return this.getVoxelByVoxel(vCoords);
  }

  getSolidityByVoxel(vCoords: Coords3) {
    return !!this.getVoxelByVoxel(vCoords);
  }

  getFluidityByVoxel(vCoords: Coords3) {
    // TODO
    return false;
  }

  getSolidityByWorld(wCoords: Coords3) {
    const vCoords = Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
    return this.getSolidityByVoxel(vCoords);
  }

  getFluidityByWorld(wCoords: Coords3) {
    const vCoords = Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
    return this.getFluidityByVoxel(vCoords);
  }

  handleServerChunk(serverChunk: ServerChunkType, prioritized = false) {
    const { x: cx, z: cz } = serverChunk;
    const coords = [cx, cz] as Coords2;
    this.requestedChunks.delete(Helper.getChunkName(coords));
    if (prioritized) this.receivedChunks.unshift(serverChunk);
    else this.receivedChunks.push(serverChunk);
  }

  setChunk(chunk: Chunk) {
    return this.chunks.set(chunk.name, chunk);
  }

  setVoxel(voxel: Coords3, type: number) {
    // TODO
    const [vx, vy, vz] = voxel;
    this.engine.network.server.sendEvent({
      type: 'UPDATE',
      json: { x: vx, y: vy, z: vz, type },
    });
  }

  breakVoxel() {
    if (this.engine.player.lookBlock) {
      // TODO: use type.air instead of 0
      this.setVoxel(this.engine.player.lookBlock, 0);
    }
  }

  placeVoxel(type: number) {
    if (this.engine.player.targetBlock) {
      this.setVoxel(this.engine.player.targetBlock, type);
    }
  }

  addAsVisible(chunk: Chunk) {
    this.visibleChunks.push(chunk);
  }

  removeAsVisible(chunk: Chunk) {
    this.visibleChunks.splice(this.visibleChunks.indexOf(chunk), 1);
  }

  get camChunkPosStr() {
    return `${this.camChunkPos[0]} ${this.camChunkPos[1]}`;
  }

  private checkCamChunk() {
    const { chunkSize, renderRadius } = this.options;

    const pos = this.engine.camera.voxel;
    const chunkPos = Helper.mapVoxelPosToChunkPos(pos, chunkSize);
    const chunkName = Helper.getChunkName(chunkPos);

    if (chunkName !== this.camChunkName) {
      this.engine.emit('chunk-changed', chunkPos);

      this.camChunkName = chunkName;
      this.camChunkPos = chunkPos;

      this.surroundCamChunks();
    }

    let supposed = 0;
    const [cx, cz] = this.camChunkPos;
    for (let x = cx - renderRadius; x <= cx + renderRadius; x++) {
      for (let z = cz - renderRadius; z <= cz + renderRadius; z++) {
        const dx = x - cx;
        const dz = z - cz;

        // sphere of chunks around camera effect
        if (dx * dx + dz * dz > renderRadius * renderRadius) continue;

        const chunk = this.getChunkByCPos([x, z]);

        if (chunk) {
          chunk.addToScene();
        }

        supposed++;
      }
    }

    if (!this.isReady && supposed <= this.chunks.size) {
      this.isReady = true;
      this.engine.emit('world-ready');
    }
  }

  private surroundCamChunks() {
    const { renderRadius, requestRadius, chunkSize } = this.options;

    const [cx, cz] = this.camChunkPos;

    for (let x = cx - requestRadius; x <= cx + requestRadius; x++) {
      for (let z = cz - requestRadius; z <= cz + requestRadius; z++) {
        const dx = x - cx;
        const dz = z - cz;
        if (dx * dx + dz * dz > requestRadius * requestRadius) continue;

        const chunk = this.getChunkByCPos([x, z]);

        if (!chunk && !this.requestedChunks.has(Helper.getChunkName([x, z]))) {
          this.pendingChunks.push([x, z]);
        }
      }
    }

    this.pendingChunks = Array.from(new Set(this.pendingChunks.map((pc) => Helper.getChunkName(pc)))).map(
      (pcStr) => Helper.parseChunkName(pcStr) as Coords2,
    );

    // make pending chunks radiate from player, might have easier ways of doing so
    this.pendingChunks.sort((a, b) => (cx - a[0]) ** 2 + (cz - a[1]) ** 2 - (cx - b[0]) ** 2 - (cz - b[1]) ** 2);

    // if the chunk is too far away, remove from scene.
    const deleteDistance = renderRadius * chunkSize * 1.414;
    for (const chunk of this.visibleChunks) {
      if (chunk.distTo(...this.engine.camera.voxel) > deleteDistance) {
        chunk.removeFromScene();
        chunk.dispose();
        this.chunks.delete(chunk.name);
      }
    }
  }

  private requestChunks() {
    // separate chunk request into frames to avoid clogging
    if (this.pendingChunks.length === 0) return;

    const { maxChunkRequestPerFrame } = this.options;

    // don't clog up the server
    if (this.requestedChunks.size < maxChunkRequestPerFrame) {
      const framePendingChunks = this.pendingChunks.splice(0, maxChunkRequestPerFrame);
      framePendingChunks.forEach(([cx, cz]) => {
        const rep = Helper.getChunkName([cx, cz]);
        if (this.requestedChunks.has(rep)) return;
        this.engine.network.server.sendEvent({
          type: 'REQUEST',
          json: { x: cx, z: cz },
        });
        this.requestedChunks.add(rep);
      });
    }
  }

  private meshChunks() {
    // separate chunk meshing into frames to avoid clogging
    if (this.receivedChunks.length === 0) return;

    const { maxChunkProcessPerFrame } = this.options;

    const frameReceivedChunks = this.receivedChunks.splice(0, maxChunkProcessPerFrame);
    frameReceivedChunks.forEach((serverChunk) => {
      const { x: cx, z: cz } = serverChunk;
      const coords = [cx, cz] as Coords2;

      let chunk = this.getChunkByCPos(coords);

      if (!chunk) {
        const { chunkSize, dimension, maxHeight } = this.options;
        chunk = new Chunk(this.engine, coords, { size: chunkSize, dimension, maxHeight });
        this.setChunk(chunk);
      }

      chunk.removeFromScene();
      chunk.setupMesh(serverChunk.meshes[0]);
      chunk.voxels.data = new Uint8Array(serverChunk.voxels);
      chunk.addToScene();
    });
  }
}

export { World, WorldOptionsType };
