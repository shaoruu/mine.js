import fs from 'fs';
import path from 'path';

import chalk from 'chalk';
import { FastifyInstance } from 'fastify';

import { Coords2, Coords3, Helper } from '../../shared';
import { GeneratorTypes } from '../libs';

import { ClientType, Network, NetworkOptionsType, Chunk, Mine } from '.';

const chunkNeighbors = [
  { x: -1, z: -1 },
  { x: 0, z: -1 },
  { x: 1, z: -1 },
  { x: -1, z: 0 },
  { x: 1, z: 0 },
  { x: -1, z: 1 },
  { x: 0, z: 1 },
  { x: 1, z: 1 },
];

type WorldOptionsType = NetworkOptionsType & {
  name: string;
  save: boolean;
  time: number;
  tickSpeed: number;
  chunkRoot: string;
  preload: number;
  chunkSize: number;
  dimension: number;
  maxHeight: number;
  renderRadius: number;
  maxLightLevel: number;
  maxLoadedChunks: number;
  useSmoothLighting: boolean;
  generation: GeneratorTypes;
  description: string;
};

class World extends Network {
  public caching = false;
  public storage: string;

  public chunks: Map<string, Chunk> = new Map();
  public chunkCache: Set<Chunk> = new Set();
  public requestedChunks: { coords: Coords2; client: ClientType }[] = [];

  public time = 0;
  public tickSpeed = 2;

  constructor(public app: FastifyInstance, public options: WorldOptionsType) {
    super(options);

    const { save, time, tickSpeed } = options;

    this.time = time;
    this.tickSpeed = tickSpeed;

    console.log(`\nWorld: ${chalk.bgCyan.gray(options.name)}`);
    if (save) this.initStorage();
    this.preloadChunks();

    let prevTime = Date.now();

    setInterval(async () => {
      // broadcast player locations
      this.clients.forEach((client) => {
        const encoded = Network.encode({
          type: 'PEER',
          peers: this.clients
            .filter((c) => c !== client && c.position && c.rotation)
            .map(({ position, rotation, id, name }) => {
              const [px, py, pz] = position;
              const [qx, qy, qz, qw] = rotation;
              return {
                id,
                name,
                px,
                py,
                pz,
                qx,
                qy,
                qz,
                qw,
              };
            }),
        });
        client.send(encoded);
      });

      // mesh chunks per frame
      const spliced = this.requestedChunks.splice(0, 2);
      spliced.forEach(({ coords, client }) => {
        const [x, z] = coords;
        const chunk = this.getChunkByCPos([x, z]);
        if (chunk.hasMesh) chunk.remesh();
        this.sendChunks(client, [chunk]);
        this.unloadChunks();
      });

      // update time
      this.time = (this.time + (this.tickSpeed * (Date.now() - prevTime)) / 1000) % 2400;
      prevTime = Date.now();
    }, 16);

    this.setupRoutes();
  }

  initStorage = () => {
    // if storage doesn't exist, make directory
    const { chunkRoot, name } = this.options;

    this.storage = path.join(chunkRoot, name);

    if (!fs.existsSync(chunkRoot)) {
      fs.mkdirSync(chunkRoot);
    }

    if (!fs.existsSync(this.storage)) {
      fs.mkdirSync(this.storage);
    }

    console.log(`Storage at ${chalk.yellow(this.storage)}`);

    // save every minute
    setInterval(() => this.save(), 60000);
  };

  preloadChunks = () => {
    const { preload } = this.options;
    console.log(`Preloading ${chalk.cyan((preload * 2 + 1) ** 2)} chunks...`);
    for (let x = -preload; x <= preload; x++) {
      for (let z = -preload; z <= preload; z++) {
        this.getChunkByCPos([x, z]).remesh();
      }
    }
    console.log(`Preloaded ${chalk.cyan((preload * 2 + 1) ** 2)} chunks.\n`);
  };

  setupRoutes = () => {
    // this.app.get()
  };

  startCaching = () => {
    this.caching = true;
  };

  stopCaching = () => {
    this.caching = false;
  };

  clearCache = () => {
    this.chunkCache.clear();
  };

  save = () => {
    if (!this.options.save) return;

    this.chunks.forEach((chunk) => {
      if (chunk.needsSaving) {
        chunk.save();
      }
    });
  };

  markForSavingFromVoxel = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    chunk.needsSaving = true;
  };

  getChunkByCPos = (cCoords: Coords2) => {
    return this.getChunkByName(Helper.getChunkName(cCoords));
  };

  getChunkByName = (chunkName: string) => {
    let chunk = this.chunks.get(chunkName);
    if (!chunk) {
      const { chunkSize, dimension, maxHeight } = this.options;
      const coords = Helper.parseChunkName(chunkName) as Coords2;
      chunk = new Chunk(coords, this, {
        dimension,
        maxHeight,
        size: chunkSize,
      });
      this.chunks.set(chunkName, chunk);
    }
    if (this.caching) this.chunkCache.add(chunk);
    return chunk;
  };

  getChunkByVoxel = (vCoords: Coords3) => {
    const { chunkSize } = this.options;
    const chunkCoords = Helper.mapVoxelPosToChunkPos(vCoords, chunkSize);
    return this.getChunkByCPos(chunkCoords);
  };

  getNeighborChunks = (coords: Coords2) => {
    const [cx, cz] = coords;
    const chunks: Chunk[] = [];
    chunkNeighbors.forEach((offset) => {
      chunks.push(this.getChunkByCPos([cx + offset.x, cz + offset.z]));
    });
    return chunks;
  };

  getVoxelByVoxel = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk ? chunk.getVoxel(vCoords) : 0;
  };

  getVoxelByWorld = (wCoords: Coords3) => {
    const vCoords = Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
    return this.getVoxelByVoxel(vCoords);
  };

  getTorchLight = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk.getTorchLight(vCoords) || 0;
  };

  setTorchLight = (vCoords: Coords3, level: number) => {
    const chunk = this.getChunkByVoxel(vCoords);
    chunk.setTorchLight(vCoords, level);
  };

  getSunlight = (vCoords: Coords3) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk.getSunlight(vCoords);
  };

  setSunlight = (vCoords: Coords3, level: number) => {
    const chunk = this.getChunkByVoxel(vCoords);
    return chunk.setSunlight(vCoords, level);
  };

  getBlockTypeByVoxel = (vCoords: Coords3) => {
    const typeID = this.getVoxelByVoxel(vCoords);
    return Mine.registry.getBlockByID(typeID);
  };

  getBlockTypeByType = (type: number) => {
    return Mine.registry.getBlockByID(type);
  };

  getMaxHeight = (column: Coords2) => {
    const chunk = this.getChunkByVoxel([column[0], 0, column[1]]);
    return chunk.getMaxHeight(column);
  };

  setMaxHeight = (column: Coords2, height: number) => {
    const chunk = this.getChunkByVoxel([column[0], 0, column[1]]);
    return chunk.setMaxHeight(column, height);
  };

  getTransparencyByVoxel = (vCoords: Coords3) => {
    return this.getBlockTypeByVoxel(vCoords).isTransparent;
  };

  setChunk = (chunk: Chunk) => {
    return this.chunks.set(chunk.name, chunk);
  };

  setVoxel = (voxel: Coords3, type: number) => {
    const chunk = this.getChunkByVoxel(voxel);
    return chunk.setVoxel(voxel, type);
  };

  onConfig = (request) => {
    const { time, tickSpeed } = request.json;

    if (Helper.isNumber(time)) this.time = time;
    if (Helper.isNumber(tickSpeed)) this.tickSpeed = tickSpeed;

    this.broadcast({
      type: 'CONFIG',
      json: request.json,
    });
  };

  onUpdate = (request) => {
    const { maxHeight } = this.options;
    const { x, y, z, type: typeStr } = request.json || {};

    const vx = parseInt(x, 10);
    const vy = parseInt(y, 10);
    const vz = parseInt(z, 10);
    const type = parseInt(typeStr, 10);
    const voxel = <Coords3>[vx, vy, vz];

    // fool proof
    if (
      Number.isNaN(x) ||
      Number.isNaN(y) ||
      Number.isNaN(z) ||
      Number.isNaN(type) ||
      y < 0 ||
      y >= maxHeight ||
      !Mine.registry.getBlockByID(type).name
    ) {
      return;
    }

    const chunk = this.getChunkByVoxel(voxel);
    if (chunk.needsPropagation) return;

    const currentType = this.getVoxelByVoxel(voxel);
    if (
      (Mine.registry.isAir(currentType) && Mine.registry.isAir(type)) ||
      (!Mine.registry.isAir(currentType) && !Mine.registry.isAir(type))
    ) {
      return;
    }

    this.startCaching();
    chunk.update(voxel, type);
    this.stopCaching();

    this.chunkCache.forEach((chunk) => {
      chunk.remesh();
      this.broadcast({
        type: 'UPDATE',
        chunks: [chunk.getProtocol(false)],
        json: {
          voxel,
          type,
        },
      });
    });

    this.clearCache();
  };

  onPeer = (request) => {
    const { id, name, px, py, pz, qx, qy, qz, qw } = request.peers[0];
    const client = this.clients.find((c) => c.id === id);

    if (client) {
      if (!client.name) {
        this.broadcast({
          type: 'MESSAGE',
          message: {
            type: 'INFO',
            body: `${name} joined the game`,
          },
        });
      }
      client.name = name;
      client.position = [px, py, pz];
      client.rotation = [qx, qy, qz, qw];
    }
  };

  onChatMessage = (request) => {
    this.broadcast({
      type: 'MESSAGE',
      message: request.message,
    });
  };

  onRequest = (client: ClientType, request) => {
    switch (request.type) {
      case 'REQUEST': {
        const { x, z } = request.json;
        this.requestedChunks.push({ coords: [x, z], client });
        break;
      }
      case 'CONFIG': {
        this.onConfig(request);
        break;
      }
      case 'UPDATE': {
        this.onUpdate(request);
        break;
      }
      case 'PEER': {
        this.onPeer(request);
        break;
      }
      case 'MESSAGE': {
        this.onChatMessage(request);
      }
      default:
        break;
    }
  };

  onInit = (client: ClientType) => {
    client.send(
      Network.encode({
        type: 'INIT',
        json: {
          id: client.id,
          time: this.time,
          tickSpeed: this.tickSpeed,
          spawn: [0, this.getMaxHeight([0, 0]), 0],
        },
      }),
    );
  };

  sendChunks = (client: ClientType, chunks: Chunk[], type = 'LOAD') => {
    client.send(
      Network.encode({
        type,
        chunks: chunks.map((c) => c.getProtocol(true)),
      }),
    );
  };

  unloadChunks() {
    const { maxLoadedChunks } = this.options;
    while (this.chunks.size > maxLoadedChunks) {
      const [oldestKey, oldestChunk] = this.chunks.entries().next().value;
      if (oldestChunk.needsSaving) {
        oldestChunk.save();
      }
      this.chunks.delete(oldestKey);
    }
  }
}

export { World, WorldOptionsType };
