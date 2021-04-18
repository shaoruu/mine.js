import { EventEmitter } from 'events';

import { Coords2, Coords3 } from '../../shared';
import { GeneratorType, SmartDictionary, FlatGenerator, Generator, SinCosGenerator } from '../libs';
import { Helper } from '../utils';

import { Chunk } from './chunk';
import { Engine } from './engine';

type WorldOptionsType = {
  maxHeight: number;
  chunkSize: number;
  chunkPadding: number;
  dimension: number;
  generator?: GeneratorType;
  renderRadius: number;
  maxChunkPerFrame: number;
  maxBlockPerFrame: number;
};

type VoxelChangeType = {
  voxel: Coords3;
  type: number;
};

class World extends EventEmitter {
  public engine: Engine;
  public generator: Generator;
  public options: WorldOptionsType;

  public isReady = false;

  private camChunkName: string;
  private camChunkPos: Coords2;

  private chunks: SmartDictionary<Chunk> = new SmartDictionary();
  private dirtyChunks: Chunk[] = []; // chunks that are freshly made
  private visibleChunks: Chunk[] = [];
  private batchedChanges: VoxelChangeType[] = [];

  constructor(engine: Engine, options: WorldOptionsType) {
    super();

    this.options = {
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

    const toBeChanged = this.batchedChanges.splice(0, this.options.maxBlockPerFrame);

    toBeChanged.forEach(({ voxel, type }) => {
      if (this.getVoxelByVoxel(voxel) === type) return;

      const chunk = this.getChunkByVoxel(voxel);
      chunk?.setVoxel(...voxel, type);
      const neighborChunks = this.getNeighborChunksByVoxel(voxel);
      neighborChunks.forEach((c) => c?.setVoxel(...voxel, type));
    });
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

  getNeighborChunksByVoxel(vCoords: Coords3, padding = this.options.chunkPadding) {
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

  getMaxHeightByVoxel(vCoords: Coords3) {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk ? chunk.getMaxHeightLocal(vCoords[0], vCoords[2]) : 0;
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

  setChunk(chunk: Chunk) {
    return this.chunks.set(chunk.name, chunk);
  }

  setVoxel(vCoords: Coords3, type: number) {
    this.batchedChanges.push({
      voxel: vCoords,
      type,
    });
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

    let chunksLoaded = 0;
    const [cx, cz] = this.camChunkPos;
    for (let x = cx - renderRadius; x <= cx + renderRadius; x++) {
      for (let z = cz - renderRadius; z <= cz + renderRadius; z++) {
        const dx = x - cx;
        const dz = z - cz;

        // sphere of chunks around camera effect
        if (dx * dx + dz * dz > renderRadius * renderRadius) continue;

        const chunk = this.getChunkByCPos([x, z]);

        if (chunk) {
          if (chunk.isInitialized) {
            chunksLoaded++;
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

    if (!this.isReady && chunksLoaded === this.chunks.data.length) {
      this.isReady = true;
      this.engine.emit('world-ready');
    }
  }

  private surroundCamChunks() {
    const { renderRadius, dimension, chunkSize, chunkPadding, maxHeight } = this.options;

    const [cx, cz] = this.camChunkPos;
    for (let x = cx - renderRadius; x <= cx + renderRadius; x++) {
      for (let z = cz - renderRadius; z <= cz + renderRadius; z++) {
        const dx = x - cx;
        const dz = z - cz;
        if (dx * dx + dz * dz > renderRadius * renderRadius) continue;

        const chunk = this.getChunkByCPos([x, z]);

        if (!chunk) {
          const newChunk = new Chunk(this.engine, [x, z], {
            maxHeight,
            dimension,
            size: chunkSize,
            padding: chunkPadding,
          });

          this.setChunk(newChunk);
          this.dirtyChunks.push(newChunk);
        }
      }
    }

    // if the chunk is too far away, remove from scene.
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
