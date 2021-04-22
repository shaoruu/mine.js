import path from 'path';

import { World } from './core';

const world = new World({
  preload: 1,
  dimension: 1,
  chunkSize: 16,
  maxClients: 10,
  maxHeight: 256,
  renderRadius: 8,
  maxLightLevel: 16,
  pingInterval: 50000,
  generation: 'hilly',
  port: process.env.PORT || 4000,
  storage: path.join(__dirname, '..', 'data'),
  isProduction: 'production' === process.env.NODE_ENV,
});

world.listen();
