import Pako from 'pako';

import { protocol } from '../../protocol';
import { Helper } from '../utils';

import { Engine } from './engine';

const { Message, ChatMessage } = protocol;

type CustomWebSocket = WebSocket & {
  sendEvent: (event) => void;
  serverURL: string;
};

type NetworkOptionsType = {
  reconnectTimeout: number;
  maxServerUpdates: number;
};

class Network {
  public server: CustomWebSocket;

  public url = Helper.getServerURL({ path: '/ws/' });
  public connected = false;

  private reconnection: NodeJS.Timeout;

  constructor(public engine: Engine, public options: NetworkOptionsType) {
    engine.on('ready', () => {
      this.connect();
    });
  }

  connect = () => {
    const url = this.url.toString();

    if (this.server) {
      this.server.onclose = null;
      this.server.onmessage = null;
      this.server.close();
      if (this.reconnection) {
        clearTimeout(this.reconnection);
      }
    }

    const socket = new URL(url);
    socket.protocol = socket.protocol.replace(/http/, 'ws');
    socket.hash = '';
    socket.searchParams.set('world', this.engine.world.name);

    const server = new WebSocket(socket.toString()) as CustomWebSocket;
    server.binaryType = 'arraybuffer';
    server.sendEvent = (event) => {
      const encoded = Network.encode(event);
      server.send(encoded);
    };
    server.onopen = () => {
      this.engine.emit('connected');
      this.engine.world.handleReconnection();
      this.connected = true;

      clearTimeout(this.reconnection);
    };
    server.onerror = () => {};
    server.onmessage = this.onMessage;
    server.onclose = () => {
      this.engine.emit('disconnected');
      this.connected = false;

      this.reconnection = setTimeout(() => {
        this.connect();
      }, this.options.reconnectTimeout);
    };

    server.serverURL = url;

    this.server = server;
  };

  onEvent = (event) => {
    const { type } = event;

    const { engine } = this;
    const { world, player, peers, entities, chat } = engine;

    switch (type) {
      case 'INIT': {
        const {
          json: { id, time, tickSpeed, spawn, passables },
        } = event;
        player.id = id;
        world.setTime(time, false);
        world.setBlockData({ passables });
        engine.setTick(tickSpeed, false);
        player.teleport(spawn);
        engine.emit('init');
        break;
      }

      case 'CONFIG': {
        const {
          json: { time, tickSpeed },
        } = event;
        if (Helper.isNumber(time)) world.setTime(time, false);
        if (Helper.isNumber(tickSpeed)) engine.setTick(tickSpeed, false);
        break;
      }

      case 'UPDATE': {
        const { updates, chunks } = event;

        for (const chunkData of chunks) {
          world.handleServerChunk(chunkData, type === 'UPDATE');
        }

        const mapped = updates.map((u) => ({
          target: {
            voxel: [u.vx, u.vy, u.vz],
            rotation: u.rotation,
            yRotation: u.yRotation,
          },
          type: u.type,
        }));

        world.setManyVoxels(mapped, false);

        break;
      }

      case 'LOAD': {
        const { chunks } = event;
        for (const chunkData of chunks) {
          world.handleServerChunk(chunkData, false);
        }
        break;
      }

      case 'JOIN': {
        const { text: id } = event;
        peers.join(id);
        break;
      }

      case 'LEAVE': {
        const { text: id, message } = event;
        peers.leave(id);
        if (message) {
          chat.add(message);
        }
        break;
      }

      case 'PEER': {
        const { peers: peersData } = event;

        for (const peer of peersData) {
          const { id, name, px, py, pz, qx, qy, qz, qw } = peer;
          if (id === player.id) continue;
          peers.update(id, { name, position: [px, py, pz], rotation: [qx, qy, qz, qw] });
        }

        break;
      }

      case 'ENTITY': {
        const { entities: entitiesData } = event;

        for (const entity of entitiesData) {
          const { id, type, px, py, pz, heading, lookAt } = entity;
          entities.handleServerUpdate(id, type, [px, py, pz], heading, lookAt);
        }

        break;
      }

      case 'MESSAGE': {
        const { message } = event;
        chat.add(message);
        break;
      }

      case 'PICK': {
        const { json } = event;
        if (this.engine.debug) {
          const { debug } = this.engine;
          debug.addHighlights(json);
        }
        break;
      }
    }
  };

  onMessage = ({ data }) => {
    let event;

    try {
      // console.log('RECEIVED');
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
    const url = Helper.getServerURL();
    return url.clearQuery().toString();
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
    if (message.message) {
      // @ts-ignore
      message.message.type = ChatMessage.Type[message.message.type];
    }
    return message;
  }

  static encode(message) {
    if (message.json) {
      message.json = JSON.stringify(message.json);
    }
    message.type = Message.Type[message.type];
    if (message.message) {
      message.message.type = ChatMessage.Type[message.message.type];
    }
    return protocol.Message.encode(protocol.Message.create(message)).finish();
  }
}

export { Network, NetworkOptionsType };
