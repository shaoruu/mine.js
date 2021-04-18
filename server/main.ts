import { World } from './core';

const port = process.env.PORT || 4000;
const isProduction = 'production' === process.env.NODE_ENV;

const world = new World({ port, isProduction, maxClients: 10, pingInterval: 50000 });

world.listen();
