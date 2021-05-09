import { EventEmitter } from 'events';
import zlib from 'zlib';

import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';

import { protocol } from '../../protocol';

const { Message } = protocol;

type NetworkOptionsType = {
  name: string;
  maxClients: number;
  pingInterval: number; // ms
};

type ClientType = WebSocket & {
  id: string;
  isAlive: boolean;
};

class Network extends EventEmitter {
  public pingInterval: NodeJS.Timeout;

  public clients: ClientType[] = [];

  constructor(public options: NetworkOptionsType) {
    super();
  }

  onConnect = (client: ClientType) => {
    const { maxClients, pingInterval } = this.options;

    if (this.clients.length === maxClients) {
      client.send(Network.encode({ type: Message.Type.ERROR, text: 'Server full. Try again later.' }));
      client.terminate();
      return;
    }

    client.id = uuidv4();
    client.isAlive = true;

    this.onInit(client);

    this.broadcast({
      type: 'JOIN',
      text: client.id,
    });

    client.once('close', () => this.onDisconnect(client));
    client.on('message', (data) => this.onMessage(client, data));
    client.on('pong', () => (client.isAlive = true));

    if (!this.pingInterval) {
      this.pingInterval = setInterval(this.ping, pingInterval);
    }

    this.clients.push(client);
  };

  onInit = (client: ClientType) => {
    console.log(`Client with ID ${client.id}joined.`);
  };

  onMessage = (client: ClientType, data: WebSocket.Data) => {
    let request: protocol.Message;
    try {
      request = Network.decode(data);
    } catch (e) {
      return;
    }
    this.onRequest(client, request);
  };

  onRequest = (client: ClientType, request: protocol.Message) => {
    switch (request.type) {
      default:
        break;
    }
  };

  onDisconnect = (client: ClientType) => {
    const { id } = client;
    const index = this.clients.findIndex((c) => c.id === id);
    if (~index) {
      this.clients.splice(index, 1);
      this.broadcast({
        type: 'LEAVE',
        text: client.id,
      });
    }
  };

  broadcast = (
    event: any,
    { exclude, include }: { exclude?: string[]; include?: string[] } = { exclude: [], include: [] },
  ) => {
    exclude = exclude || [];
    include = include || [];

    const encoded = Network.encode(event);

    this.clients.forEach((client) => {
      if ((!include.length || ~include.indexOf(client.id)) && (!exclude || exclude.indexOf(client.id) === -1)) {
        client.send(encoded);
      }
    });
  };

  ping = () => {
    this.clients.forEach((client) => {
      if (client.isAlive === false) {
        client.terminate();
        return;
      }
      client.isAlive = false;
      client.ping();
    });
  };

  static decode(buffer: any) {
    const message = Message.decode(buffer);
    // @ts-ignore
    message.type = Message.Type[message.type];
    if (message.json) {
      message.json = JSON.parse(message.json);
    }
    return message;
  }

  static encode(message: any) {
    // @ts-ignore
    message.type = Message.Type[message.type];
    if (message.json) {
      message.json = JSON.stringify(message.json);
    }
    const buffer = Message.encode(Message.create(message)).finish();
    if (buffer.length > 1024) {
      return zlib.deflateSync(buffer);
    }
    return buffer;
  }
}

export { ClientType, Network, NetworkOptionsType };
