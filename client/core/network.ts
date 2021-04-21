import Pako from 'pako';

import { protocol } from '../../protocol';

import { Engine } from './engine';

const { Message } = protocol;

type CustomWebSocket = WebSocket & {
  sendEvent: (event) => void;
  serverURL: string;
};

type NetworkOptionsType = {
  url: string;
};

class Network {
  public server: CustomWebSocket;

  public connected = false;

  constructor(public engine: Engine, public options: NetworkOptionsType) {
    this.connect(options.url);
  }

  connect = (url: string) => {
    const socket = new URL(url);
    socket.protocol = socket.protocol.replace(/http/, 'ws');
    socket.hash = '';

    const server = new WebSocket(socket.toString()) as CustomWebSocket;
    server.binaryType = 'arraybuffer';
    server.sendEvent = (event) => {
      server.send(Network.encode(event));
    };
    server.onopen = () => (this.connected = true);
    server.onerror = (e) => console.error(e);
    server.onmessage = this.onMessage;
    server.onclose = () => (this.connected = false);
    server.serverURL = url;

    this.server = server;
  };

  onEvent = (event) => {
    const { type } = event;

    switch (type) {
      case 'INIT': {
        const { chunks } = event;
        const {
          engine: { world },
        } = this;
        for (const chunkData of chunks) {
          world.handleServerChunk(chunkData);
        }
        world.isReady = true;
        this.engine.emit('world-ready');
        break;
      }
      case 'LOAD': {
        const { chunks } = event;
        const {
          engine: { world },
        } = this;
        for (const chunkData of chunks) {
          world.handleServerChunk(chunkData);
        }
        break;
      }
    }
  };

  onMessage = ({ data }) => {
    let event;
    try {
      event = Network.decode(new Uint8Array(data));
    } catch (e) {
      return;
    }
    this.onEvent(event);
  };

  static decode(buffer) {
    if (buffer[0] === 0x78 && buffer[1] === 0x9c) {
      buffer = Pako.inflate(buffer);
    }
    const message = Message.decode(buffer);
    // @ts-ignore
    message.type = Message.Type[message.type];
    if (message.json) {
      message.json = JSON.parse(message.json);
    }
    return message;
  }

  static encode(message) {
    if (message.json) {
      message.json = JSON.stringify(message.json);
    }
    message.type = Message.Type[message.type];
    return protocol.Message.encode(protocol.Message.create(message)).finish();
  }
}

export { Network, NetworkOptionsType };
