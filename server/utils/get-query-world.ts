import { IncomingMessage } from 'http';
import querystring from 'querystring';

import { Mine } from '../core';

function getQueryWorld(request: IncomingMessage) {
  let { world: worldName } = querystring.parse(request.url.split('?')[1]);
  worldName = worldName ? (typeof worldName === 'string' ? worldName : worldName.join('')) : 'testbed';

  const world = Mine.hasWorld(worldName) ? Mine.getWorld(worldName) : Mine.randomWorld();
  return world;
}

export { getQueryWorld };
