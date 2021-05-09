import { IncomingMessage } from 'http';
import path from 'path';
import querystring from 'querystring';

import chalk from 'chalk';
import fastify from 'fastify';
import WebSocket from 'ws';

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
Mine.registerWorld(app, 'testbed');
Mine.registerWorld(app, 'mine', {
  generation: 'hilly',
});

// MAIN SOCKET HANDLING TRAFFIC
const wss = new WebSocket.Server({ server: app.server });
wss.on('connection', (client: ClientType, request: IncomingMessage) => {
  let { world: worldName } = querystring.parse(request.url.split('?')[1]);
  worldName = worldName ? (typeof worldName === 'string' ? worldName : worldName.join('')) : 'testbed';
  if (!Mine.hasWorld(worldName)) worldName = 'testbed';
  Mine.getWorld(worldName)?.onConnect(client);
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀  Server listening on ${chalk.green(`http://localhost:${port}`)}`);
});
