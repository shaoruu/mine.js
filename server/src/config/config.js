export default {
  world: {
    gravity: -16,
    maxWorldHeight: 256,
    waterLevel: 62,
    waterColor: 0x0084ff,
    generation: {
      classicGeneration: {
        swampland: {
          constants: {
            scale: 1.5,
            octaves: 5,
            persistance: 1,
            lacunarity: 1.5,
            heightOffset: 2.3,
            amplifier: 0.2,
            treeMin: 0.65,
            treeScale: 8,
            grassMin: 0.58,
            grassScale: 10
          },
          types: {
            top: 2,
            underTop: 3,
            beach: 12
          }
        },
        mountains: {
          constants: {
            scale: 2,
            octaves: 10,
            persistance: 1,
            lacunarity: 1,
            heightOffset: 2.5,
            amplifier: 1,
            treeMin: 0.63,
            treeScale: 10,
            grassMin: 0.65,
            grassScale: 0.6
          },
          types: {
            top: 2,
            underTop: 3,
            beach: 12
          }
        }
      }
    }
  }
}
