/**
 * THIS IS WHERE ALL THE CONSTANTS LIVE
 */
import { BLOCKS } from './blockDict'

const Config = {
  tech: {
    maxWorkerCount: 1,
    socketEndpoint: `${self.location.hostname}:5000`
  },
  game: {
    autoSaveInterval: 5 * 1000 * 60 // ms
  },
  lights: {
    sunlight: {
      maxIntensity: 1.25,
      minIntensity: 0.2
    },
    ambientLight: {
      enabled: true,
      color: 0xffffff,
      intensity: 1.2
    },
    aoConfigs: {
      slDifference: 70,
      levels: [
        14,
        19,
        23,
        28,
        34,
        41,
        48,
        57,
        67,
        79,
        93,
        110,
        132,
        160,
        197,
        250
      ],
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
    far: 1200,
    aspect: 1,
    posX: 0,
    posY: 0,
    posZ: 0,
    sprintFovDelta: 15,
    spectatorFov: 130,
    thirdPerson: {
      posX: 0,
      posY: 0,
      posZ: 80
    },
    secondPerson: {
      posX: 0,
      posY: 0,
      posZ: -80
    }
  },
  keyboard: {
    camera: {
      togglePerspective: 86
    },
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
    rollOverColor: 0x000000,
    acceleration: {
      forward: 50,
      other_horz: 20,
      vertical: 40
    },
    jump: {
      time: 80, // ms
      force: 80
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
      depth: 0.5,
      sneakDifference: 0.2
    },
    coordinateDec: 2,
    position: {
      posX: 0.48,
      posY: 4.49,
      posZ: 5.53
    },
    times: {
      // ms
      sneakTime: 60
    },
    reachDst: 7,
    headBodyDeg: Math.PI / 4,
    health: {
      max: 20,
      min: 0,
      hungerIncrementTime: 10000,
      hungerIncrement: 1,
      hungerDecrementTime: 3000,
      hungerDecrement: 1,
      hungerMin: 1
    },
    hunger: {
      max: 20,
      min: 0,
      hungerDecrementTime: 15000,
      hungerDecrement: 1,
      slowWalk: 6
    },
    armor: {
      max: 20,
      min: 0
    }
  },
  block: {
    dimension: 32,
    plant: [31],
    transparent: [0, 9, 18, 31, 95],
    passable: [0, 9, 31],
    liquid: [0, 9]
  },
  chunk: {
    size: 8,
    neighborWidth: 3,
    height: 256
  },
  world: {
    gravity: -16,
    waterColor: 0x0084ff,
    generation: {
      superflatGeneration: {
        // TODO: make this customizable
        maxHeight: 5,
        types: {
          top: BLOCKS.GRASS,
          middle: BLOCKS.DIRT
        }
      },
      classicGeneration: {
        maxWorldHeight: 256,
        waterLevel: 62,
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
            top: BLOCKS.GRASS,
            underTop: BLOCKS.DIRT,
            beach: BLOCKS.SAND
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
            top: BLOCKS.GRASS,
            underTop: BLOCKS.DIRT,
            beach: BLOCKS.SAND
          }
        }
      }
    }
  }
}

export default Config
