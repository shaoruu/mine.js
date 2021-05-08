import path from 'path';

import { World } from './core';

const isProduction = 'production' === process.env.NODE_ENV;

const world = new World({
  name: 'test',
  isProduction,
  dimension: 1,
  chunkSize: 8,
  maxClients: 10,
  maxHeight: 128,
  renderRadius: 8,
  maxLightLevel: 15,
  generation: 'flat',
  pingInterval: 50000,
  maxLoadedChunks: 2000,
  useSmoothLighting: true,
  port: process.env.PORT || 4000,
  preload: isProduction ? 12 : 1,
  chunkRoot: path.join(__dirname, '..', 'data'),
});

world.listen();
