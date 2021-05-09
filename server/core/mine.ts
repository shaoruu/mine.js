import path from 'path';

import { FastifyInstance } from 'fastify';

import { GeneratorTypes, World, WorldOptionsType, Registry } from '.';

const defaultWorldOptions = {
  name: 'testbed',
  dimension: 1,
  chunkSize: 8,
  maxClients: 10,
  maxHeight: 128,
  renderRadius: 8,
  maxLightLevel: 15,
  generation: 'flat' as GeneratorTypes,
  pingInterval: 50000,
  maxLoadedChunks: 2000,
  useSmoothLighting: true,
  port: 4000,
  chunkRoot: path.join(__dirname, '../..', 'data'),
};

class Mine {
  public static worlds: Map<string, World> = new Map();
  public static registry = new Registry({ basePath: path.join(__dirname, '..', 'blocks') });

  public static registerWorld(app: FastifyInstance, name: string, options: Partial<WorldOptionsType> = {}) {
    Mine.worlds.set(
      name,
      new World(app, {
        ...defaultWorldOptions,
        preload: process.env.NODE_ENV === 'production' ? 12 : 1,
        ...options,
        name,
      }),
    );
  }

  public static hasWorld(name: string | undefined) {
    return !!name && Mine.worlds.has(name);
  }

  public static getWorld(name: string) {
    return Mine.worlds.get(name);
  }

  public static randomWorld() {
    const worlds = Array.from(this.worlds);
    return worlds[Math.floor(Math.random() * worlds.length)][1];
  }
}

export { Mine };
