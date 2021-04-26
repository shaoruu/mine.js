import path from 'path';

import { World } from './core';

const world = new World({
  preload: 1,
  dimension: 1,
  chunkSize: 8,
  maxClients: 10,
  maxHeight: 128,
  renderRadius: 8,
  maxLightLevel: 15,
  pingInterval: 50000,
  generation: 'flat',
  useSmoothLighting: true,
  port: process.env.PORT || 4000,
  storage: path.join(__dirname, '..', 'data'),
  isProduction: 'production' === process.env.NODE_ENV,
});

world.listen();
