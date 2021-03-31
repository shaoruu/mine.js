import { EventEmitter } from 'events';

import { Engine } from '..';
import {
  Coords3,
  GeneratorType,
  SmartDictionary,
  FlatGenerator,
  Generator,
  SinCosGenerator,
  LightNode,
  fillLights,
  Coords2,
} from '../libs';
import { Helper } from '../utils';

import { Chunk } from './chunk';

type WorldOptionsType = {
  maxHeight: number;
  chunkSize: number;
  chunkPadding: number;
  dimension: number;
  generator?: GeneratorType;
  renderRadius: number;
  maxChunkPerFrame: number;
  maxBlockPerFrame: number;
  maxLightLevel: number;
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

    const lightPlacement: LightNode[] = [];
    const lightRemoval: LightNode[] = [];

    toBeChanged.forEach(({ voxel, type }) => {
      if (this.getVoxelByVoxel(voxel) === type) return;

      const chunk = this.getChunkByVoxel(voxel);
      chunk?.setVoxel(...voxel, type);
      const neighborChunks = this.getNeighborChunksByVoxel(voxel);
      neighborChunks.forEach((c) => c?.setVoxel(...voxel, type));

      const lightLevel = this.engine.registry.getLightByIndex(type);

      // lighting
      if (lightLevel > 0) {
        lightPlacement.push({ voxel, level: lightLevel });
      } else {
        const blockLight = this.getTorchLight(voxel);
        // if (blockLight > 0) {
        lightRemoval.push({ voxel, level: blockLight });
        // }
      }
    });

    this.removeTorchLights(lightRemoval);
    // offload this kind of propagation to another thread
    fillLights(lightPlacement, this);
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

  getTorchLight(vCoords: Coords3) {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk?.getTorchLight(...vCoords) || 0;
  }

  setTorchLight(vCoords: Coords3, level: number) {
    const chunk = this.getChunkByVoxel(vCoords);
    chunk?.setTorchLight(...vCoords, level);
    const neighborChunks = this.getNeighborChunksByVoxel(vCoords);
    neighborChunks.forEach((c) => c?.setTorchLight(...vCoords, level));
  }

  getSunlight(vCoords: Coords3) {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk?.getSunlight(...vCoords) || 0;
  }

  setSunlight(vCoords: Coords3, level: number) {
    const chunk = this.getChunkByVoxel(vCoords);
    chunk?.setSunlight(...vCoords, level);
    const neighborChunks = this.getNeighborChunksByVoxel(vCoords);
    neighborChunks.forEach((c) => c?.setSunlight(...vCoords, level));
  }

  async applySunlight(chunk: Chunk) {
    const { minInner, maxInner } = chunk;
    const [endX, endY, endZ] = maxInner;
    const sunlightNodes: LightNode[] = [];

    for (let vx = minInner[0]; vx < endX; vx++) {
      for (let vz = minInner[2]; vz < endZ; vz++) {
        const topVoxel: Coords3 = [vx, endY - 1, vz];
        if (this.getVoxelByVoxel(topVoxel) === 0) {
          sunlightNodes.push({
            level: 16,
            voxel: topVoxel,
          });
        }
      }
    }
  }

  // resource: https://www.seedofandromeda.com/blogs/29-fast-flood-fill-lighting-in-a-blocky-voxel-game-pt-1
  removeTorchLights(lightRemovalBfsQueue: LightNode[]) {
    if (lightRemovalBfsQueue.length === 0) return;
    // flood-fill lighting removal

    // from high to low
    lightRemovalBfsQueue.sort((a, b) => b.level - a.level);
    lightRemovalBfsQueue.forEach(({ voxel }) => this.setTorchLight(voxel, 0));

    const temp = new Set<string>();
    lightRemovalBfsQueue.forEach(({ voxel }) => temp.add(`${voxel[0]}|${voxel[1]}|${voxel[2]}`));

    const lightBfsQueue: LightNode[] = [];

    while (lightRemovalBfsQueue.length !== 0) {
      const lightNode = lightRemovalBfsQueue.shift();
      if (lightNode) {
        const { level, voxel } = lightNode;
        const [vx, vy, vz] = voxel;

        const directions = [
          [1, 0, 0],
          [-1, 0, 0],
          [0, 1, 0],
          [0, -1, 0],
          [0, 0, 1],
          [0, 0, -1],
        ];

        directions.forEach(([dirX, dirY, dirZ]) => {
          const newVX = vx + dirX;
          const newVY = vy + dirY;
          const newVZ = vz + dirZ;

          if (temp.has(`${newVX}|${newVY}|${newVZ}`)) return;

          const neighborLevel = this.getTorchLight([newVX, newVY, newVZ]);
          if (neighborLevel !== 0 && neighborLevel < level) {
            this.setTorchLight([newVX, newVY, newVZ], 0);
            lightRemovalBfsQueue.push({
              level: neighborLevel,
              voxel: [newVX, newVY, newVZ],
            });
          } else if (neighborLevel >= level) {
            lightBfsQueue.push({
              level: neighborLevel,
              voxel: [newVX, newVY, newVZ],
            });
          }
        });
      }
    }

    this.propagateLightQueue(lightBfsQueue);
  }

  propagateLightQueue(lightQueue: LightNode[], isSunlight = false) {
    // propagate light on the main thread
    while (lightQueue.length !== 0) {
      const lightNode = lightQueue.shift();

      if (lightNode) {
        const { level, voxel } = lightNode;
        const [vx, vy, vz] = voxel;

        if (isSunlight) this.setSunlight(voxel, level);
        else this.setTorchLight(voxel, level);

        // 6 directions, representing the 6 faces of a block
        const directions = [
          [1, 0, 0],
          [-1, 0, 0],
          [0, 1, 0],
          [0, -1, 0],
          [0, 0, 1],
          [0, 0, -1],
        ];

        const sunlightDirections = [
          [1, 0, 0, -1],
          [-1, 0, 0, -1],
          [0, -1, 0, 0],
          [0, 0, 1, -1],
          [0, 0, -1, -1],
        ];

        (isSunlight ? sunlightDirections : directions).forEach(([dirX, dirY, dirZ, delta]) => {
          // neighboring voxel coordinates
          const newVX = vx + dirX;
          const newVY = vy + dirY;
          const newVZ = vz + dirZ;

          delta = isSunlight ? delta : -1;

          if (
            this.getVoxelByVoxel([newVX, newVY, newVZ]) === 0 &&
            (isSunlight ? this.getSunlight([newVX, newVY, newVZ]) : this.getTorchLight([newVX, newVY, newVZ])) + 2 <=
              level
          ) {
            if (isSunlight) this.setSunlight([newVX, newVY, newVZ], level + delta);
            else this.setTorchLight([newVX, newVY, newVZ], level + delta);
            lightQueue.push({
              level: level + delta,
              voxel: [newVX, newVY, newVZ],
            });
          }
        });
      }
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

    if (chunksLoaded === this.chunks.data.length) {
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
