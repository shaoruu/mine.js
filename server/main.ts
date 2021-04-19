import path from 'path';

import { Generator, World } from './core';

const generator = new Generator({ basePath: path.join(__dirname, 'blocks') });

const world = new World({
  dimension: 1,
  chunkSize: 16,
  maxClients: 10,
  maxHeight: 256,
  renderRadius: 8,
  maxLightLevel: 16,
  pingInterval: 50000,
  port: process.env.PORT || 4000,
  storage: path.join(__dirname, '..', 'data'),
  isProduction: 'production' === process.env.NODE_ENV,
});

world.listen();

// import { loadImage } from 'canvas';

// import { TextureAtlas } from './libs';

// (async () => {
//   const imagePath = path.join(__dirname, 'blocks', 'assets', 'favicon.png');
//   const myImage = await loadImage(imagePath);

//   const textureMap = {
//     test1: myImage,
//     test2: myImage,
//     test3: myImage,
//   };

//   const test = new TextureAtlas(textureMap);
//   console.log(test.canvas.toDataURL());
// })();
