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
  renderRadius: 0,
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
    const { chunkSize } = this.options;

    const pos = this.engine.camera.voxel;
    const chunkPos = Helper.mapVoxelPosToChunkPos(pos, chunkSize);
    const chunkName = Helper.getChunkName(chunkPos);

    if (chunkName !== this.camChunkName) {
      this.engine.emit('chunk-changed', chunkPos);

      this.camChunkName = chunkName;
      this.camChunkPos = chunkPos;

      this.surroundCamChunks();
    }
  }

  private surroundCamChunks() {
    const { renderRadius, dimension, chunkSize, chunkPadding } = this.options;

    for (let i = -renderRadius; i <= renderRadius; i++) {
      for (let j = -renderRadius; j <= renderRadius; j++) {
        for (let k = -renderRadius; j <= renderRadius; j++) {
          const mChunkPos = vec3.create() as Coords3;
          vec3.add(mChunkPos, this.camChunkPos, [i, j, k]);

          const chunk = this.getChunkByCPos(mChunkPos);
          if (!chunk) {
            const newChunk = new Chunk(this.engine, mChunkPos, { size: chunkSize, dimension, padding: chunkPadding });

            this.setChunk(newChunk);
            this.dirtyChunks.push(newChunk);
            continue;
          }

          if (chunk.isInitialized && !chunk.isDirty) {
            this.engine.rendering.scene.add(chunk.mesh);
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
          break;
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
