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
    server.onerror = (e) => console.error(e);
    server.onmessage = this.onMessage;
    server.serverURL = url;

    this.server = server;
  };

  onEvent = (event) => {
    const { chunks } = event;
    console.log(chunks[0].meshes[0].opaque);
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
    message.type = protocol.Message.Type[message.type];
    if (message.json) {
      message.json = JSON.stringify(message.json);
    }
    return protocol.Message.encode(protocol.Message.create(message)).finish();
  }
}

export { Network, NetworkOptionsType };
