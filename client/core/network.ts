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

  onInit = (event) => {
    const { world, player } = this.engine;
    const {
      json: { id, time, tickSpeed, spawn, passables },
    } = event;

    player.id = id;
    player.teleport(spawn);

    world.setTime(time, false);
    world.setBlockData({ passables });

    this.engine.setTick(tickSpeed, false);
    this.engine.emit('init');
  };

  onConfig = (event) => {
    const {
      json: { time, tickSpeed },
    } = event;

    if (Helper.isNumber(time)) this.engine.world.setTime(time, false);
    if (Helper.isNumber(tickSpeed)) this.engine.setTick(tickSpeed, false);
  };

  onUpdate = (event) => {
    const { world } = this.engine;
    const { updates, chunks } = event;

    for (const chunkData of chunks) {
      world.handleServerChunk(chunkData, true);
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
  };

  onLoad = (event) => {
    const { world } = this.engine;
    const { chunks } = event;

    for (const chunkData of chunks) {
      world.handleServerChunk(chunkData, false);
    }
  };

  onJoin = (event) => {
    const { text: id } = event;

    this.engine.peers.join(id);
  };

  onLeave = (event) => {
    const { peers, chat } = this.engine;
    const { text: id, message } = event;

    peers.leave(id);

    if (message) {
      chat.add(message);
    }
  };

  onPeer = (event) => {
    const { player, peers } = this.engine;
    const { peers: peersData } = event;

    for (const peer of peersData) {
      const { id, name, px, py, pz, qx, qy, qz, qw } = peer;
      if (id === player.id) continue;
      peers.update(id, { name, position: [px, py, pz], rotation: [qx, qy, qz, qw] });
    }
  };

  onEntity = (event) => {
    const { entities } = this.engine;
    const { entities: entitiesData } = event;

    for (const entity of entitiesData) {
      const { id, type, px, py, pz, heading, lookAt } = entity;
      entities.handleServerUpdate(id, type, [px, py, pz], heading, lookAt);
    }
  };

  onChat = (event) => {
    const { message } = event;
    this.engine.chat.add(message);
  };

  onEvent = (event) => {
    const { type } = event;

    switch (type) {
      case 'INIT': {
        this.onInit(event);
        break;
      }

      case 'CONFIG': {
        this.onConfig(event);
        break;
      }

      case 'UPDATE': {
        this.onUpdate(event);
        break;
      }

      case 'LOAD': {
        this.onLoad(event);
        break;
      }

      case 'JOIN': {
        this.onJoin(event);
        break;
      }

      case 'LEAVE': {
        this.onLeave(event);
        break;
      }

      case 'PEER': {
        this.onPeer(event);
        break;
      }

      case 'ENTITY': {
        this.onEntity(event);
        break;
      }

      case 'MESSAGE': {
        this.onChat(event);
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
