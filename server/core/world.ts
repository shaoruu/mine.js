import { protocol } from '../../protocol';

import { ClientType, Network, NetworkOptionsType } from './network';

type WorldOptionsType = NetworkOptionsType & {
  test?: string;
};

class World extends Network {
  constructor(public options: WorldOptionsType) {
    super(options);
  }

  getChunk = () => {};

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
