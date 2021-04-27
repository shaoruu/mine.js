import fs from 'fs';
import path from 'path';

import { Coords2, Coords3, Helper } from '../../shared';

import { ClientType, Network, NetworkOptionsType, Chunk, GeneratorTypes, Registry } from '.';

const chunkNeighbors = [
  { x: -1, z: -1 },
  { x: 0, z: -1 },
  { x: 1, z: -1 },
  { x: -1, z: 0 },
  { x: 1, z: 0 },
  { x: -1, z: 1 },
  { x: 0, z: 1 },
  { x: 1, z: 1 },
];

type WorldOptionsType = NetworkOptionsType & {
  storage: string;
  preload: number;
  chunkSize: number;
  dimension: number;
  maxHeight: number;
  renderRadius: number;
  maxLightLevel: number;
  maxLoadedChunks: number;
  useSmoothLighting: boolean;
  generation: GeneratorTypes;
};

class World extends Network {
  public registry: Registry;

  public caching = false;

  public requestedChunks: { coords: Coords2; client: ClientType }[] = [];
  public chunkCache: Set<Chunk> = new Set();
  public chunks: Map<string, Chunk> = new Map();

  constructor(public options: WorldOptionsType) {
    super(options);

    this.registry = new Registry({ basePath: path.join(__dirname, '..', 'blocks') });

    this.initStorage();
    this.setupRoutes();
    this.preloadChunks();

    setInterval(async () => {
      const spliced = this.requestedChunks.splice(0, 2);
      spliced.forEach(({ coords, client }) => {
        const [x, z] = coords;
        const chunk = this.getChunkByCPos([x, z]);
        if (chunk.hasMesh) chunk.remesh();
        this.sendChunks(client, [chunk]);
        this.unloadChunks();
      });
    }, 16);
  }

  initStorage = () => {
    // if storage doesn't exist, make directory
    const { storage } = this.options;

    if (!fs.existsSync(storage)) {
      fs.mkdirSync(storage);
    }

    // save every minute
    setInterval(() => this.save(), 60000);
  };

  setupRoutes = () => {
    // texture atlas
    this.app.get('/atlas', (_, res) => {
      res.setHeader('Content-Type', 'image/png');
      this.registry.textureAtlas.canvas.createPNGStream().pipe(res);
    });
  };

  preloadChunks = () => {
    const { preload } = this.options;
    console.log(`Preloading ${(preload * 2 + 1) ** 2} chunks...`);
    for (let x = -preload; x <= preload; x++) {
      for (let z = -preload; z <= preload; z++) {
        this.getChunkByCPos([x, z]).remesh();
      }
    }
    console.log(`Preloaded ${(preload * 2 + 1) ** 2} chunks.`);
  };

  startCaching = () => {
    this.caching = true;
  };

  stopCaching = () => {
    this.caching = false;
  };

  clearCache = () => {
    this.chunkCache.clear();
  };

  save = () => {
    this.chunks.forEach((chunk) => {
      if (chunk.needsSaving) {
        chunk.save();
      }
    });
  };

  markForSavingFromVoxel = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    chunk.needsSaving = true;
  };

  getChunkByCPos = (cCoords: Coords2) => {
    return this.getChunkByName(Helper.getChunkName(cCoords));
  };

  getChunkByName = (chunkName: string) => {
    let chunk = this.chunks.get(chunkName);
    if (!chunk) {
      const { chunkSize, dimension, maxHeight } = this.options;
      const coords = Helper.parseChunkName(chunkName) as Coords2;
      chunk = new Chunk(coords, this, {
        dimension,
        maxHeight,
        size: chunkSize,
      });
      this.chunks.set(chunkName, chunk);
    }
    if (this.caching) this.chunkCache.add(chunk);
    return chunk;
  };

  getChunkByVoxel = (vCoords: Coords3) => {
    const { chunkSize } = this.options;
    const chunkCoords = Helper.mapVoxelPosToChunkPos(vCoords, chunkSize);
    return this.getChunkByCPos(chunkCoords);
  };

  getNeighborChunks = (coords: Coords2) => {
    const [cx, cz] = coords;
    const chunks: Chunk[] = [];
    chunkNeighbors.forEach((offset) => {
      chunks.push(this.getChunkByCPos([cx + offset.x, cz + offset.z]));
    });
    return chunks;
  };

  getVoxelByVoxel = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk ? chunk.getVoxel(vCoords) : 0;
  };

  getVoxelByWorld = (wCoords: Coords3) => {
    const vCoords = Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
    return this.getVoxelByVoxel(vCoords);
  };

  getTorchLight = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk.getTorchLight(vCoords) || 0;
  };

  setTorchLight = (vCoords: Coords3, level: number) => {
    const chunk = this.getChunkByVoxel(vCoords);
    chunk.setTorchLight(vCoords, level);
  };

  getSunlight = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk.getSunlight(vCoords);
  };

  setSunlight = (vCoords: Coords3, level: number) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk.setSunlight(vCoords, level);
  };

  getBlockTypeByVoxel = (vCoords: Coords3) => {
    const typeID = this.getVoxelByVoxel(vCoords);
    return this.registry.getBlockByID(typeID);
  };

  getBlockTypeByType = (type: number) => {
    return this.registry.getBlockByID(type);
  };

  getMaxHeight = (column: Coords2) => {
    const chunk = this.getChunkByVoxel([column[0], 0, column[1]]);
    return chunk.getMaxHeight(column);
  };

  setMaxHeight = (column: Coords2, height: number) => {
    const chunk = this.getChunkByVoxel([column[0], 0, column[1]]);
    return chunk.setMaxHeight(column, height);
  };

  getSolidityByVoxel = (vCoords: Coords3) => {};

  getFluidityByVoxel = (vCoords: Coords3) => {
    return false;
  };

  getSolidityByWorld = () => {};

  getFluidityByWorld = (wCoords: Coords3) => {
    const vCoords = Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
    return this.getFluidityByVoxel(vCoords);
  };

  getTransparencyByVoxel = (vCoords: Coords3) => {
    return this.getBlockTypeByVoxel(vCoords).isTransparent;
  };

  setChunk = (chunk: Chunk) => {
    return this.chunks.set(chunk.name, chunk);
  };

  setVoxel = (voxel: Coords3, type: number) => {
    const chunk = this.getChunkByVoxel(voxel);
    return chunk.setVoxel(voxel, type);
  };

  onRequest = (client: ClientType, request) => {
    switch (request.type) {
      case 'REQUEST': {
        const { x, z } = request.json;
        this.requestedChunks.push({ coords: [x, z], client });
        break;
      }
      case 'UPDATE': {
        const { maxHeight } = this.options;
        const { x, y, z, type: typeStr } = request.json || {};

        const vx = parseInt(x, 10);
        const vy = parseInt(y, 10);
        const vz = parseInt(z, 10);
        const type = parseInt(typeStr, 10);
        const voxel = [vx, vy, vz] as Coords3;

        // fool proof
        if (
          Number.isNaN(x) ||
          Number.isNaN(y) ||
          Number.isNaN(z) ||
          Number.isNaN(type) ||
          y <= 0 ||
          y >= maxHeight ||
          !this.registry.getBlockByID(type).name
        ) {
          return;
        }

        const chunk = this.getChunkByVoxel(voxel);
        if (chunk.needsPropagation) return;

        const currentType = this.getVoxelByVoxel(voxel);
        if (
          (this.registry.isAir(currentType) && this.registry.isAir(type)) ||
          (!this.registry.isAir(currentType) && !this.registry.isAir(type))
        ) {
          return;
        }

        this.startCaching();
        chunk.update(voxel, type);
        this.stopCaching();

        const chunkProtocols = Array.from(this.chunkCache).map((chunk) => {
          chunk.remesh();
          return chunk.getProtocol(false);
        });

        this.clearCache();

        chunkProtocols.forEach((cp) => {
          this.broadcast({
            type: 'UPDATE',
            chunks: [cp],
            json: {
              voxel,
              type,
            },
          });
        });

        break;
      }
      default:
        break;
    }
  };

  onInit = (client: ClientType) => {
    const test = 2;
    const chunks: Chunk[] = [];

    for (let x = -test; x <= test; x++) {
      for (let z = -test; z <= test; z++) {
        chunks.push(this.getChunkByCPos([x, z]));
      }
    }

    client.send(
      Network.encode({
        type: 'INIT',
        json: {
          spawn: [0, this.getMaxHeight([0, 0]), 0],
        },
      }),
    );
  };

  sendChunks = (client: ClientType, chunks: Chunk[], type = 'LOAD') => {
    client.send(
      Network.encode({
        type,
        chunks: chunks.map((c) => c.getProtocol(true)),
      }),
    );
  };

  unloadChunks() {
    const { maxLoadedChunks } = this.options;
    while (this.chunks.size > maxLoadedChunks) {
      const [oldestKey, oldestChunk] = this.chunks.entries().next().value;
      if (oldestChunk.needsSaving) {
        oldestChunk.save();
      }
      this.chunks.delete(oldestKey);
    }
  }
}

export { World };
