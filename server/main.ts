import fs from 'fs';
import { IncomingMessage } from 'http';
import path from 'path';
import querystring from 'querystring';

import chalk from 'chalk';
import fastify from 'fastify';
import WebSocket from 'ws';

import { WORLD_LIST } from '../shared/saves';

import { ClientType, Mine } from './core';

const isProduction = 'production' === process.env.NODE_ENV;

// BASE APP
const app = fastify();
app.register(require('fastify-cors'));
if (isProduction) {
  app.register(require('fastify-static'), {
    root: path.join(__dirname, '..', 'public'),
  });
}

// ATLAS
app.get('/atlas', (_, reply) => {
  reply.header('Content-Type', 'image/png').send(Mine.registry.textureAtlas.canvas.createPNGStream());
});

// WORLD SETUPS
const { WORLDS } = process.env;
if (WORLDS) {
  let worldNames: string[];
  if (WORLDS === '*') worldNames = Object.keys(WORLD_LIST);
  else worldNames = WORLDS.split(',');

  worldNames.forEach((name) => {
    const data = WORLD_LIST[name];
    if (!data) {
      console.log(chalk.red(`World ${name} not found.`));
      return;
    }
    Mine.registerWorld(app, name, data);
  });
} else {
  console.log(chalk.red('No worlds loaded!'));
}

// MAIN SOCKET HANDLING TRAFFIC
const wss = new WebSocket.Server({ server: app.server });
wss.on('connection', (client: ClientType, request: IncomingMessage) => {
  let { world: worldName } = querystring.parse(request.url.split('?')[1]);
  worldName = worldName ? (typeof worldName === 'string' ? worldName : worldName.join('')) : 'testbed';

  const world = Mine.hasWorld(worldName) ? Mine.getWorld(worldName) : Mine.randomWorld();
  console.log(worldName);
  world?.onConnect(client);
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀  Server listening on ${chalk.green(`http://localhost:${port}`)}`);
});
