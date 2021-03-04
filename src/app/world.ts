import { EventEmitter } from 'events';

import vec3 from 'gl-vec3';

import { Engine } from '..';
import {
  Coords3,
  GeneratorType,
  SmartDictionary,
  DefaultGenerator,
  FlatGenerator,
  Generator,
  SinCosGenerator,
} from '../libs';
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
  generator: 'flat',
  // radius of rendering centered by camera
  renderRadius: 3,
  // maximum amount of chunks to process per frame tick
  maxChunkPerFrame: 1,
};

class World extends EventEmitter {
  public engine: Engine;
  public generator: Generator;
  public options: WorldOptionsType;

  private camChunkName: string;
  private camChunkPos: Coords3;

  private chunks: SmartDictionary<Chunk>;
  private dirtyChunks: Chunk[];

  constructor(engine: Engine, options: Partial<WorldOptionsType> = {}) {
    super();

    this.options = {
      ...options,
      ...defaultWorldOptions,
    };

    const { generator } = this.options;

    this.engine = engine;

    this.chunks = new SmartDictionary<Chunk>();
    this.dirtyChunks = [];

    switch (generator) {
      case 'default':
        this.generator = new DefaultGenerator(this.engine);
      case 'flat':
        this.generator = new FlatGenerator(this.engine);
      case 'sin-cos':
        this.generator = new SinCosGenerator(this.engine);
    }
  }

  tick() {
    // Check camera position
    this.checkCamChunk();
    this.meshDirtyChunks();
  }

  getChunkByCPos(coords: Coords3) {
    return this.getChunkByName(Helper.getChunkName(coords));
  }

  getChunkByName(chunkName: string) {
    return this.chunks.get(chunkName);
  }

  setChunk(chunk: Chunk) {
    return this.chunks.set(chunk.name, chunk);
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
          if (dx * dx + dy * dy + dz * dz > renderRadius * renderRadius) continue;

          const chunk = this.getChunkByCPos([x, y, z]);

          if (chunk && !chunk.isDirty && chunk.isInitialized) {
            chunk.addToScene();
          }
        }
      }
    }
  }

  private surroundCamChunks() {
    const { renderRadius, dimension, chunkSize, chunkPadding, maxChunkPerFrame } = this.options;

    let count = 0;
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
            count++;

            this.setChunk(newChunk);
            this.dirtyChunks.push(newChunk);
            continue;
          }
        }
      }
    }
  }

  private meshDirtyChunks() {
    if (this.dirtyChunks.length > 0) {
      let count = 0;
      while (count <= this.options.maxChunkPerFrame && this.dirtyChunks.length > 0) {
        const chunk = this.dirtyChunks.shift();
        if (!chunk) break;
        if (!chunk.isInitialized) {
          // if chunk data has not been initialized
          this.requestChunkData(chunk);
          this.dirtyChunks.push(chunk);
          continue;
        }
        chunk.buildMesh();
        count++;
      }
    }
  }

  private requestChunkData(chunk: Chunk) {
    if (!this.generator) {
      this.engine.emit('data-needed', chunk);
      return;
    }

    this.generator.generate(chunk);
  }
}

export { World };
