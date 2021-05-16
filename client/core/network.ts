import Pako from 'pako';

import { protocol } from '../../protocol';
import { Helper as SharedHelper } from '../../shared';
import { Helper } from '../utils';

import { Engine } from './engine';

const { Message } = protocol;

type CustomWebSocket = WebSocket & {
  sendEvent: (event) => void;
  serverURL: string;
};

class Network {
  public server: CustomWebSocket;

  public url = Helper.getServerURL();
  public connected = false;

  public worldName: string;

  constructor(public engine: Engine) {}

  join = (worldName: string) => {
    this.worldName = worldName;
    this.connect(this.url.toString());
  };

  connect = (url: string) => {
    const socket = new URL(url);
    socket.protocol = socket.protocol.replace(/http/, 'ws');
    socket.hash = '';
    socket.searchParams.set('world', this.worldName);

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

    const { engine } = this;
    const { world, player } = engine;

    switch (type) {
      case 'INIT': {
        const {
          json: { time, tickSpeed, spawn },
        } = event;
        world.setTime(time, false);
        engine.setTick(tickSpeed, false);
        player.teleport(spawn);
        break;
      }
      case 'CONFIG': {
        const {
          json: { time, tickSpeed },
        } = event;
        if (SharedHelper.isNumber(time)) world.setTime(time, false);
        if (SharedHelper.isNumber(tickSpeed)) engine.setTick(tickSpeed, false);
        break;
      }
      case 'UPDATE': {
        const {
          json: { voxel, type },
        } = event;
        world.setVoxel(voxel, type, false);
      }
      case 'LOAD': {
        const { chunks } = event;
        for (const chunkData of chunks) {
          world.handleServerChunk(chunkData, type === 'UPDATE');
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

  fetchData = async (path: string, args: { [key: string]: any } = {}) => {
    const url = Helper.getServerURL();
    url.path = `/${path.replace('/', '')}`;
    for (const key in args) url.query[key] = args[key];
    const response = await fetch(url.toString());
    return response.json();
  };

  get cleanURL() {
    return this.url.clearQuery().toString();
  }

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

export { Network };
