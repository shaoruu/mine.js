import { Coords2, Helper } from '../../shared';
import { Coords3 } from '../../shared/types';

import { World, Chunk, ClientType } from '.';

class Chunks {
  private chunks: Map<string, Chunk> = new Map();

  constructor(public world: World) {}

  all = () => {
    return Array.from(this.chunks.values());
  };

  data = () => {
    return this.chunks;
  };

  raw = (coords: Coords2) => {
    const chunk = this.getChunk(coords);
    return chunk;
  };

  get = (coords: Coords2) => {
    const chunk = this.getChunk(coords);

    // TODO: add more conditions here?
    if (
      !chunk ||
      chunk.needsTerrain ||
      chunk.needsDecoration ||
      chunk.neighbors.length !== 8 ||
      chunk.neighbors.filter((n) => n.needsDecoration).length !== 0
    ) {
      return null;
    }

    return chunk;
  };

  preload = async (width: number) => {
    await this.load([0, 0], width);
  };

  generate = async (client: ClientType) => {
    const { currentChunk, renderRadius } = client;
    if (currentChunk) await this.load(currentChunk, renderRadius);
  };

  setVoxel = (voxel: Coords3, type: number) => {
    const { chunkSize } = this.world.options;
    const coords = Helper.mapVoxelPosToChunkPos(voxel, chunkSize);
    this.raw(coords)?.setVoxel(voxel, type);
  };

  private load = async (coords: Coords2, renderRadius: number, mesh = false) => {
    const { chunkSize, dimension, maxHeight } = this.world.options;

    const [cx, cz] = coords;

    const toDecorate: Chunk[] = [];
    const toGenerate: Chunk[] = [];

    const terrainRadius = renderRadius + 4;
    const decorateRadius = renderRadius;

    for (let x = -terrainRadius; x <= terrainRadius; x++) {
      for (let z = -terrainRadius; z <= terrainRadius; z++) {
        const dist = x ** 2 + z ** 2;
        if (dist >= terrainRadius * terrainRadius) continue;

        const coords = [cx + x, cz + z] as Coords2;
        let chunk = this.getChunk(coords);

        // chunk is not yet initialized
        if (!chunk) {
          // make chunk
          chunk = new Chunk(coords, this.world, { dimension, size: chunkSize, maxHeight });
          toGenerate.push(chunk);
          this.addChunk(chunk);
        }

        if (dist <= decorateRadius * decorateRadius) {
          toDecorate.push(chunk);
        }
      }
    }

    // a promise that generates terrains in parallel
    await new Promise((resolve) => {
      let count = 0;
      toGenerate.forEach((chunk) => {
        chunk.generate().then(() => {
          count++;
          if (count === toGenerate.length) {
            resolve(true);
          }
        });
      });
    });

    // at this point, we've made sure that chunks around the
    // player have terrains. time to decorate them
    toDecorate.forEach((chunk) => {
      if (chunk.needsDecoration) {
        chunk.decorate();
      }
    });

    // after decoration, generate height map for future process
    toDecorate.forEach((chunk) => {
      chunk.generateHeightMap();
    });

    if (mesh) {
      toDecorate.forEach((chunk) => {
        if (chunk.isDirty) chunk.remesh();
      });
    }
  };

  private addChunk = (chunk: Chunk) => {
    this.chunks.set(chunk.name, chunk);
  };

  private getChunk = (coords: Coords2) => {
    const name = Helper.getChunkName(coords);
    return this.chunks.get(name);
  };
}

export { Chunks };
