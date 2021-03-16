// Engine options object, and engine instantiation:
const { Engine } = MineJS;

let loaded = 0;
const images = {};

const imagesMap = {
  'grass-top': 'resources/grass_top.png',
  'grass-side': 'resources/grass_side.png',
  dirt: 'resources/dirt.png',
  stone: 'resources/stone.png',
  lol: 'resources/lol.jpeg',
  lol2: 'resources/lol.png',
  lol3: 'resources/chug2.png',
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

    engine.registry.addMaterial('grass-top', { image: images['grass-top'] });
    engine.registry.addMaterial('grass-side', { image: images['grass-side'] });
    engine.registry.addMaterial('grass-bottom', { image: images['dirt'] });
    engine.registry.addMaterial('dirt', { image: images['dirt'] });
    engine.registry.addMaterial('stone', { image: images['stone'] });
    engine.registry.addMaterial('lol', { image: images['lol'] });
    engine.registry.addMaterial('lol2', { image: images['lol2'] });
    engine.registry.addMaterial('lol3', { image: images['lol3'] });

    engine.registry.addBlock('grass', ['grass-top', 'grass-side', 'grass-bottom']);
    const stoneID = engine.registry.addBlock('stone', 'stone');
    const lolID = engine.registry.addBlock('lol', ['lol', 'lol2', 'lol3']);

    let eButton,
      down = false;
    document.addEventListener('mousedown', ({ button }) => ((down = true), (eButton = button)), false);
    document.addEventListener('mouseup', () => {
      down = false;
    });

    engine.on('tick-begin', () => {
      if (down) {
        if (eButton === 0) {
          if (!engine.camera.lookBlock) return;
          const [clx, cly, clz] = engine.camera.lookBlock;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              for (let k = -1; k <= 1; k++) {
                engine.world.setVoxel([clx + i, cly + j, clz + k], 0);
              }
            }
          }
          engine.world.breakVoxel();
        } else if (eButton === 2) {
          if (!engine.camera.targetBlock) return;
          const [ctx, cty, ctz] = engine.camera.targetBlock;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              for (let k = -1; k <= 1; k++) {
                engine.world.setVoxel([ctx + i, cty + j, ctz + k], lolID);
              }
            }
          }
        } else if (eButton === 2) {
          engine.world.placeVoxel(stoneID);
        }
      }
    });

    document.addEventListener('keypress', ({ key }) => {
      const range = 10;
      const [px, py, pz] = engine.camera.voxel;
      if (key === 'f') {
        for (let i = -range; i <= range; i++) {
          for (let j = -range; j <= range; j++) {
            for (let k = -range; k <= range; k++) {
              engine.world.setVoxel([px + i, py + j, pz + k], 0);
            }
          }
        }
      } else if (key === 'g') {
        for (let i = -range; i <= range; i++) {
          for (let j = -range; j <= range; j++) {
            for (let k = -range; k <= range; k++) {
              engine.world.setVoxel([px + i, py + j, pz + k], lolID);
            }
          }
        }
      }
    });

    engine.start();
  }
}
