import fs from 'fs';
import path from 'path';

import { protocol } from '../../protocol';
import { Coords2, Coords3, Helper, SmartDictionary } from '../../shared';

import { Registry } from './registry';

import { ClientType, Network, NetworkOptionsType, Chunk } from '.';

type WorldOptionsType = NetworkOptionsType & {
  storage: string;
  chunkSize: number;
  dimension: number;
  maxHeight: number;
  renderRadius: number;
  maxLightLevel: number;
};

class World extends Network {
  public registry: Registry;

  public chunks: SmartDictionary<Chunk> = new SmartDictionary();

  constructor(public options: WorldOptionsType) {
    super(options);

    this.registry = new Registry({ basePath: path.join(__dirname, '..', 'blocks') });

    this.initStorage();
  }

  initStorage = () => {
    // if storage doesn't exist, make directory
    const { storage } = this.options;

    if (!fs.existsSync(storage)) {
      fs.mkdirSync(storage);
    }
  };

  getChunkByCPos = (cCoords: Coords2) => {
    return this.getChunkByName(Helper.getChunkName(cCoords));
  };

  getChunkByName = (chunkName: string) => {
    return this.chunks.get(chunkName);
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
    super.onInit(client);
  };
}

export { World };
