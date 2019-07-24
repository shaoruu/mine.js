/**
 * THIS IS WHERE ALL THE CONSTANTS LIVE
 */

const Config = {
  lights: {
    ambientLight: {
      enabled: true,
      color: 0xffffff,
      intensity: 1.2
    },
    aoConfigs: {
      slDifference: 70,
      levels: [14, 19, 23, 28, 34, 41, 48, 57, 67, 79, 93, 110, 132, 160, 197, 250],
      lowestLight: 30
    }
  },
  scene: {
    background: {
      color: 0xdbe8ff
    },
    fog: {
      color: 0xdcebf4,
      near: 0.0008
    },
    lod: 5
  },
  camera: {
    fov: 102,
    near: 1,
    aspect: 1,
    posX: 0,
    posY: 0,
    posZ: 0,
    sprintFovDelta: 15,
    spectatorFov: 130
  },
  keyboard: {
    movements: {
      forward: 87,
      backward: 83,
      left: 65,
      right: 68,
      sneak: 16,
      jump: 32
    },
    inventory: {
      h1: 49,
      h2: 50,
      h3: 51,
      h4: 52,
      h5: 53,
      h6: 54,
      h7: 55,
      h8: 56,
      h9: 57
    },
    multiplayer: {
      openChat: 84,
      openCommand: 191
    },
    dblTimeout: 200 // ms
  },
  player: {
    height: 50, // px
    inertia: 10,
    fricIntertia: 15.0,
    inAirInertia: 16, // For jumping
    sprintFactor: 1.3,
    spectatorInertia: 6,
    acceleration: {
      forward: 500,
      other_horz: 250,
      vertical: 400
    },
    jump: {
      time: 150, // ms
      force: 300
    },
    maxSpeed: {
      horizontal: 700,
      vertical: 800
    },
    aabb: {
      // Based on block dimension
      width: 0.5,
      eye2toe: 1.6,
      eye2top: 0.2,
      depth: 0.5
    },
    coordinateDec: 2,
    position: {
      posX: 0.48,
      posY: 4.49,
      posZ: 5.53
    },
    render: {
      horzD: 2,
      vertD: 1
    },
    reachDst: 7
  },
  block: {
    dimension: 32,
    transparent: [0, 9, 18],
    overridable: [0],
    liquid: [0, 9]
  },
  chunk: {
    size: 10,
    neighborWidth: 3,
    height: 256,
    maxPerFrame: 8
  },
  world: {
    gravity: -160,
    maxWorldHeight: 256,
    waterLevel: 62,
    waterColor: 0x0095ff,
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
            treeMin: 0.8,
            treeScale: 8
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
            treeMin: 0.6,
            treeScale: 7
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

export default Config
