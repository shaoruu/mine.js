import fs from 'fs';
import path from 'path';

import { protocol } from '../../protocol';
import { Coords2, Coords3, Helper, SmartDictionary } from '../../shared';

import { ClientType, Network, NetworkOptionsType, Chunk, GeneratorTypes, Registry } from '.';

type WorldOptionsType = NetworkOptionsType & {
  storage: string;
  preload: number;
  chunkSize: number;
  dimension: number;
  maxHeight: number;
  renderRadius: number;
  maxLightLevel: number;
  generation: GeneratorTypes;
};

class World extends Network {
  public registry: Registry;

  public chunks: SmartDictionary<Chunk> = new SmartDictionary();

  constructor(public options: WorldOptionsType) {
    super(options);

    this.registry = new Registry({ basePath: path.join(__dirname, '..', 'blocks') });

    this.initStorage();
    this.setupRoutes();
    this.preloadChunks();
  }

  initStorage = () => {
    // if storage doesn't exist, make directory
    const { storage } = this.options;

    if (!fs.existsSync(storage)) {
      fs.mkdirSync(storage);
    }
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

  getChunkByCPos = (cCoords: Coords2) => {
    return this.getChunkByName(Helper.getChunkName(cCoords));
  };

  getChunkByName = (chunkName: string) => {
    let chunk = this.chunks.get(chunkName);
    if (!chunk) {
      const { chunkSize, generation, dimension, maxHeight } = this.options;
      const coords = Helper.parseChunkName(chunkName) as Coords2;
      chunk = new Chunk(coords, this, {
        dimension,
        maxHeight,
        generation,
        size: chunkSize,
      });
      this.chunks.set(chunkName, chunk);
    }
    return chunk;
  };

  getChunkByVoxel = (vCoords: Coords3) => {
    const { chunkSize } = this.options;
    const chunkCoords = Helper.mapVoxelPosToChunkPos(vCoords, chunkSize);
    return this.getChunkByCPos(chunkCoords);
  };

  getNeighborChunksByVoxel = () => {};

  getVoxelByVoxel = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk ? chunk.getVoxel(vCoords) : null;
  };

  getVoxelByWorld = (wCoords: Coords3) => {
    const vCoords = Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
    return this.getVoxelByVoxel(vCoords);
  };

  getMaxHeightByVoxel = () => {};

  getSolidityByVoxel = (vCoords: Coords3) => {};

  getFluidityByVoxel = (vCoords: Coords3) => {
    return false;
  };

  getSolidityByWorld = () => {};

  getFluidityByWorld = (wCoords: Coords3) => {
    const vCoords = Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
    return this.getFluidityByVoxel(vCoords);
  };

  setChunk = (chunk: Chunk) => {
    return this.chunks.set(chunk.name, chunk);
  };

  setVoxel = () => {};

  onRequest = (client: ClientType, request: protocol.Message) => {
    super.onRequest(client, request);

    switch (request.type) {
      default:
        break;
    }
  };

  onInit = (client: ClientType) => {
    const chunk = this.getChunkByCPos([0, 0]);

    client.send(
      Network.encode({
        type: 'INIT',
        chunks: [chunk.protocol],
      }),
    );
  };
}

export { World };
