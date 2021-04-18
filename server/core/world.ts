import { protocol } from '../../protocol';

import { Chunk } from './chunk';
import { ClientType, Network, NetworkOptionsType } from './network';

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
  }

  setupStorage = () => {};

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
