import { EventEmitter } from 'events';

import { Engine } from '..';
import { Coords3, GeneratorType, SmartDictionary, FlatGenerator, Generator, SinCosGenerator } from '../libs';
import { Helper } from '../utils';

import { Chunk } from './chunk';

type WorldOptionsType = {
  chunkSize: number;
  chunkPadding: number;
  dimension: number;
  generator?: GeneratorType;
  renderRadius: number;
  maxChunkPerFrame: number;
};

const defaultWorldOptions: WorldOptionsType = {
  chunkSize: 32,
  chunkPadding: 2,
  dimension: 1,
  generator: 'sin-cos',
  // radius of rendering centered by camera
  renderRadius: 3,
  // maximum amount of chunks to process per frame tick
  maxChunkPerFrame: 2,
};

class World extends EventEmitter {
  public engine: Engine;
  public generator: Generator;
  public options: WorldOptionsType;

  private camChunkName: string;
  private camChunkPos: Coords3;

  private chunks: SmartDictionary<Chunk> = new SmartDictionary();
  private dirtyChunks: Chunk[] = []; // chunks that are freshly made
  private visibleChunks: Chunk[] = [];

  constructor(engine: Engine, options: Partial<WorldOptionsType> = {}) {
    super();

    this.options = {
      ...defaultWorldOptions,
      ...options,
    };

    const { generator } = this.options;

    this.engine = engine;

    switch (generator) {
      case 'flat':
        this.generator = new FlatGenerator(this.engine);
        break;
      case 'sin-cos':
        this.generator = new SinCosGenerator(this.engine);
    }
  }

  tick() {
    // Check camera position
    this.checkCamChunk();
    this.meshDirtyChunks();
  }

  getChunkByCPos(cCoords: Coords3) {
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

  getNeighborChunksByVoxel(vCoords: Coords3) {
    const { chunkSize, chunkPadding } = this.options;
    const [cx, cy, cz] = Helper.mapVoxelPosToChunkPos(vCoords, chunkSize);
    const [lx, ly, lz] = Helper.mapVoxelPosToChunkLocalPos(vCoords, chunkSize);
    const neighborChunks: (Chunk | null)[] = [];
    // check if local position is on the edge
    // TODO: fix this hacky way of doing so.
    const a = lx < chunkPadding;
    const b = ly < chunkPadding;
    const c = lz < chunkPadding;
    const d = lx >= chunkSize - chunkPadding;
    const e = ly >= chunkSize - chunkPadding;
    const f = lz >= chunkSize - chunkPadding;

    // direct neighbors
    if (a) neighborChunks.push(this.getChunkByCPos([cx - 1, cy, cz]));
    if (b) neighborChunks.push(this.getChunkByCPos([cx, cy - 1, cz]));
    if (c) neighborChunks.push(this.getChunkByCPos([cx, cy, cz - 1]));
    if (d) neighborChunks.push(this.getChunkByCPos([cx + 1, cy, cz]));
    if (e) neighborChunks.push(this.getChunkByCPos([cx, cy + 1, cz]));
    if (f) neighborChunks.push(this.getChunkByCPos([cx, cy, cz + 1]));

    // side-to-side diagonals
    if (a && b) neighborChunks.push(this.getChunkByCPos([cx - 1, cy - 1, cz]));
    if (a && c) neighborChunks.push(this.getChunkByCPos([cx - 1, cy, cz - 1]));
    if (a && e) neighborChunks.push(this.getChunkByCPos([cx - 1, cy + 1, cz]));
    if (a && f) neighborChunks.push(this.getChunkByCPos([cx - 1, cy, cz + 1]));
    if (b && c) neighborChunks.push(this.getChunkByCPos([cx, cy - 1, cz - 1]));
    if (b && d) neighborChunks.push(this.getChunkByCPos([cx + 1, cy - 1, cz]));
    if (b && f) neighborChunks.push(this.getChunkByCPos([cx, cy - 1, cz + 1]));
    if (c && d) neighborChunks.push(this.getChunkByCPos([cx + 1, cy, cz - 1]));
    if (c && e) neighborChunks.push(this.getChunkByCPos([cx, cy + 1, cz - 1]));
    if (d && e) neighborChunks.push(this.getChunkByCPos([cx + 1, cy + 1, cz]));
    if (d && f) neighborChunks.push(this.getChunkByCPos([cx + 1, cy, cz + 1]));
    if (e && f) neighborChunks.push(this.getChunkByCPos([cx, cy + 1, cz + 1]));

    // direct diagonals
    if (a && b && c) neighborChunks.push(this.getChunkByCPos([cx - 1, cy - 1, cz - 1]));
    if (a && b && f) neighborChunks.push(this.getChunkByCPos([cx - 1, cy - 1, cz + 1]));
    if (a && c && e) neighborChunks.push(this.getChunkByCPos([cx - 1, cy + 1, cz - 1]));
    if (a && e && f) neighborChunks.push(this.getChunkByCPos([cx - 1, cy + 1, cz + 1]));
    if (b && c && d) neighborChunks.push(this.getChunkByCPos([cx + 1, cy - 1, cz - 1]));
    if (b && d && f) neighborChunks.push(this.getChunkByCPos([cx + 1, cy - 1, cz + 1]));
    if (c && d && e) neighborChunks.push(this.getChunkByCPos([cx + 1, cy + 1, cz - 1]));
    if (d && e && f) neighborChunks.push(this.getChunkByCPos([cx + 1, cy + 1, cz + 1]));
    return neighborChunks.filter(Boolean);
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
    return this.getVoxelByVoxel(vCoords) !== 0;
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

  setChunk(chunk: Chunk) {
    return this.chunks.set(chunk.name, chunk);
  }

  setVoxel(vCoords: Coords3, type: number) {
    const chunk = this.getChunkByVoxel(vCoords);
    chunk?.setVoxel(...vCoords, type);
    const neighborChunks = this.getNeighborChunksByVoxel(vCoords);
    neighborChunks.forEach((c) => c?.setVoxel(...vCoords, type));
  }

  breakVoxel() {
    if (this.engine.camera.lookBlock) {
      this.setVoxel(this.engine.camera.lookBlock, 0);
    }
  }

  placeVoxel(type: number) {
    if (this.engine.camera.targetBlock) {
      this.setVoxel(this.engine.camera.targetBlock, type);
    }
  }

  addAsVisible(chunk: Chunk) {
    this.visibleChunks.push(chunk);
  }

  removeAsVisible(chunk: Chunk) {
    this.visibleChunks.splice(this.visibleChunks.indexOf(chunk), 1);
  }

  get camChunkPosStr() {
    return `${this.camChunkPos[0]} ${this.camChunkPos[1]} ${this.camChunkPos[2]}`;
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

    const [cx, cy, cz] = this.camChunkPos;
    for (let x = cx - renderRadius; x <= cx + renderRadius; x++) {
      for (let y = cy - renderRadius; y <= cy + renderRadius; y++) {
        for (let z = cz - renderRadius; z <= cz + renderRadius; z++) {
          const dx = x - cx;
          const dy = y - cy;
          const dz = z - cz;

          // sphere of chunks around camera effect
          if (dx * dx + dy * dy + dz * dz > renderRadius * renderRadius) continue;

          const chunk = this.getChunkByCPos([x, y, z]);

          if (chunk) {
            if (chunk.isInitialized) {
              if (!chunk.isDirty) {
                if (!chunk.isAdded) {
                  chunk.addToScene();
                }
              } else {
                // this means chunk is dirty. two possibilities:
                // 1. chunk has just been populated with terrain data
                // 2. chunk is modified
                if (!chunk.isMeshing) {
                  chunk.buildMesh();
                }
              }
            }
          }
        }
      }
    }
  }

  private surroundCamChunks() {
    const { renderRadius, dimension, chunkSize, chunkPadding } = this.options;

    const [cx, cy, cz] = this.camChunkPos;
    for (let x = cx - renderRadius; x <= cx + renderRadius; x++) {
      for (let y = cy - renderRadius; y <= cy + renderRadius; y++) {
        for (let z = cz - renderRadius; z <= cz + renderRadius; z++) {
          const dx = x - cx;
          const dy = y - cy;
          const dz = z - cz;
          if (dx * dx + dy * dy + dz * dz > renderRadius * renderRadius) continue;

          const chunk = this.getChunkByCPos([x, y, z]);

          if (!chunk) {
            const newChunk = new Chunk(this.engine, [x, y, z], { size: chunkSize, dimension, padding: chunkPadding });

            this.setChunk(newChunk);
            this.dirtyChunks.push(newChunk);
          }
        }
      }
    }

    const deleteDistance = renderRadius * chunkSize * dimension;
    for (const chunk of this.visibleChunks) {
      if (chunk.distTo(...this.engine.camera.voxel) > deleteDistance) {
        chunk.removeFromScene();
      }
    }
  }

  private meshDirtyChunks() {
    if (this.dirtyChunks.length > 0) {
      let count = 0;
      while (count <= this.options.maxChunkPerFrame && this.dirtyChunks.length > 0) {
        count++;

        const chunk = this.dirtyChunks.shift();

        if (!chunk) break; // array is empty?
        // chunk needs to be populated with terrain data
        // `isInitialized` will be switched to true once terrain data is set
        this.requestChunkData(chunk);
        continue;
      }
    }
  }

  private async requestChunkData(chunk: Chunk) {
    if (!this.generator) {
      // client side terrain generation, call chunk.initialized once finished.
      // assume the worst, say the chunk is not empty
      chunk.isEmpty = false;
      chunk.isPending = true;
      this.engine.emit('data-needed', chunk);
      return;
    }

    await this.generator.generate(chunk);
    await chunk.initialized();
  }
}

export { World, WorldOptionsType };
