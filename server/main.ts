import path from 'path';

import { World } from './core';

const world = new World({
  chunkSize: 16,
  dimension: 1,
  isProduction: 'production' === process.env.NODE_ENV,
  maxClients: 10,
  maxHeight: 256,
  maxLightLevel: 16,
  pingInterval: 50000,
  port: process.env.PORT || 4000,
  renderRadius: 8,
  storage: path.join(__dirname, '..', 'data'),
});

world.listen();
