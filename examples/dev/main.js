// Engine options object, and engine instantiation:
const { Engine } = MineJS;

let loaded = 0;
const images = {};

const imagesMap = {
  'grass-top': 'resources/grass_top.png',
  'grass-side': 'resources/grass_side.png',
  dirt: 'resources/dirt.png',
  stone: 'resources/stone.png',
  'not-sure': 'resources/not-sure.png',
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
      worldOptions: {
        generator: 'sin-cos',
      },
    });

    engine.registry.addMaterial('grass-top', { image: images['grass-top'] });
    engine.registry.addMaterial('grass-side', { image: images['grass-side'] });
    engine.registry.addMaterial('grass-bottom', { image: images['dirt'] });
    engine.registry.addMaterial('dirt', { image: images['dirt'] });
    engine.registry.addMaterial('stone', { image: images['stone'] });
    engine.registry.addMaterial('not-sure', { image: images['not-sure'] });

    // engine.registry.addBlock('grass', ['grass-top', 'grass-side', 'grass-bottom']);
    // const stoneID = engine.registry.addBlock('stone', 'stone');
    const notSureID = engine.registry.addBlock('not-sure', 'not-sure');

    document.addEventListener(
      'mousedown',
      ({ button }) => {
        if (!engine.isLocked) return;

        if (button === 0) {
          engine.world.breakVoxel();
        } else if (button === 1) {
          if (!engine.camera.targetBlock) return;
          const [ctx, cty, ctz] = engine.camera.targetBlock;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              for (let k = -1; k <= 1; k++) {
                engine.world.setVoxel([ctx + i, cty + j, ctz + k], stoneID);
              }
            }
          }
        } else if (button === 2) {
          engine.world.placeVoxel(notSureID);
        }
      },
      false,
    );

    document.addEventListener('keypress', ({ key }) => {
      const range = 3;
      if (key === 'f') {
        const [px, py, pz] = engine.camera.voxel;
        for (let i = -range; i <= range; i++) {
          for (let j = -range; j <= range; j++) {
            for (let k = -range; k <= range; k++) {
              engine.world.setVoxel([px + i, py + j, pz + k], 0);
            }
          }
        }
      } else if (key === 'r') {
        if (!engine.camera.lookBlock) return;
        const [clx, cly, clz] = engine.camera.lookBlock;
        for (let i = -range; i <= range; i++) {
          for (let j = -range; j <= range; j++) {
            for (let k = -range; k <= range; k++) {
              if (i * i + j * j + k * k > range * range) continue;

              engine.world.setVoxel([clx + i, cly + j, clz + k], 0);
            }
          }
        }
      } else if (key === 'x') {
        if (!engine.camera.lookBlock) return;
        const [clx, cly, clz] = engine.camera.lookBlock;
        for (let i = -range; i <= range; i++) {
          for (let j = -range; j <= range; j++) {
            for (let k = -range; k <= range; k++) {
              if (i * i + j * j + k * k > range * range) continue;

              engine.world.setVoxel([clx + i, cly + j, clz + k], notSureID);
            }
          }
        }
      } else if (key === 'z') {
        const [px, py, pz] = engine.camera.voxel;
        for (let i = -range; i <= range; i++) {
          for (let j = -range; j <= range; j++) {
            engine.world.setVoxel([px + i, py + 2, pz + j], notSureID);
          }
        }
      }
    });

    engine.start();
  }
}
