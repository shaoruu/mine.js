// Engine options object, and engine instantiation:
const { Engine } = MineJS;

let loaded = 0;
const images = {};

const imagesMap = {
  'grass-top': 'resources/grass_top.png',
  'grass-side': 'resources/grass_side.png',
  dirt: 'resources/dirt.png',
  stone: 'resources/stone.png',
  lol: 'resources/lol.png',
};

Object.keys(imagesMap).forEach((key) => {
  const img = new Image();
  img.src = imagesMap[key];
  img.onload = sharedOnLoad;
  images[key] = img;
});

function sharedOnLoad() {
  loaded++;

  if (loaded === Object.keys(images).length) {
    const engine = new Engine({
      generator: 'sin-cos',
    });

    console.log(images);

    engine.registry.addMaterial('grass-top', { image: images['grass-top'] });
    engine.registry.addMaterial('grass-side', { image: images['grass-side'] });
    engine.registry.addMaterial('grass-bottom', { image: images['dirt'] });
    engine.registry.addMaterial('stone', { image: images['stone'] });
    engine.registry.addMaterial('lol', { image: images['lol'] });

    engine.registry.addBlock('grass', ['grass-top', 'grass-side', 'grass-bottom']);
    engine.registry.addBlock('stone', 'stone');
    const lolID = engine.registry.addBlock('lol', 'lol');

    let mousePressed = false,
      eButton = null;
    document.addEventListener('mousedown', ({ button }) => ((mousePressed = true), (eButton = button)), false);
    document.addEventListener('mouseup', ({ button }) => ((mousePressed = false), (eButton = button)), false);

    engine.start();

    engine.on('tick-begin', () => {
      console.log('ok');
      if (mousePressed) {
        if (eButton === 0) {
          engine.world.breakVoxel();
        } else if (eButton === 1) {
          const [clx, cly, clz] = engine.camera.lookBlock;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              for (let k = -1; k <= 1; k++) {
                engine.world.setVoxel([clx + i, cly + j, clz + k], 0);
              }
            }
          }
        } else if (eButton === 2) {
          engine.world.placeVoxel(lolID);
        }
      }
    });
  }
}
