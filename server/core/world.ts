import fs from 'fs';

import { protocol } from '../../protocol';

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
  public chunks: Chunk[];

  constructor(public options: WorldOptionsType) {
    super(options);

    this.initStorage();
  }

  initStorage = () => {
    // if storage doesn't exist, make directory
    const { storage } = this.options;

    if (!fs.existsSync(storage)) {
      fs.mkdirSync(storage);
    }
  };

  getChunkByCPos = () => {};

  getChunkByVoxel = () => {};

  getNeighborChunksByVoxel = () => {};

  getVoxelByVoxel = () => {};

  getVoxelByWorld = () => {};

  getMaxHeightByVoxel = () => {};

  getSolidityByVoxel = () => {};

  getFluidityByVoxel = () => {};

  getSolidityByWorld = () => {};

  getFluidityByWorld = () => {};

  setChunk = () => {};

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
