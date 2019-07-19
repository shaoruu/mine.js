/* eslint-disable global-require */

import * as THREE from 'three'

const resources = {
  textures: {
    blocks: {
      1: {
        top: require('../assets/blocks/stone.png'),
        side: require('../assets/blocks/stone.png'),
        bottom: require('../assets/blocks/stone.png'),
        config: {
          transparent: false,
          side: THREE.FrontSide
        }
      },
      2: {
        top: require('../assets/blocks/grass_top.png'),
        side: require('../assets/blocks/grass_side.png'),
        bottom: require('../assets/blocks/dirt.png'),
        config: {
          transparent: false,
          side: THREE.FrontSide
        }
      },
      3: {
        top: require('../assets/blocks/dirt.png'),
        side: require('../assets/blocks/dirt.png'),
        bottom: require('../assets/blocks/dirt.png'),
        config: {
          transparent: false,
          side: THREE.FrontSide
        }
      },
      9: {
        top: require('../assets/blocks/water_still.png'),
        side: require('../assets/blocks/water_still.png'),
        bottom: require('../assets/blocks/water_still.png'),
        config: {
          transparent: true,
          side: THREE.DoubleSide
        }
      },
      12: {
        top: require('../assets/blocks/sand.png'),
        side: require('../assets/blocks/sand.png'),
        bottom: require('../assets/blocks/sand.png'),
        config: {
          transparent: false,
          side: THREE.FrontSide
        }
      },
      17: {
        top: require('../assets/blocks/log_oak_top.png'),
        side: require('../assets/blocks/log_oak.png'),
        bottom: require('../assets/blocks/log_oak_top.png'),
        config: {
          transparent: false,
          side: THREE.FrontSide
        }
      },
      18: {
        top: require('../assets/blocks/leaves_oak.png'),
        side: require('../assets/blocks/leaves_oak.png'),
        bottom: require('../assets/blocks/leaves_oak.png'),
        config: {
          transparent: true,
          side: THREE.DoubleSide,
          color: 0x1f6b1e,
          alphaTest: 0.15
        }
      },
      95: {
        top: require('../assets/blocks/glass_blue.png'),
        side: require('../assets/blocks/glass_blue.png'),
        bottom: require('../assets/blocks/glass_blue.png'),
        config: {
          transparent: true,
          side: THREE.DoubleSide,
          alphaTest: 0.15
        }
      }
    }
  },
  geometries: {
    blocks: {
      px: {
        func: 'rotateY',
        rotation: Math.PI / 2,
        translation: {
          x: 1,
          y: 0.5,
          z: 0.5
        }
      },
      py: {
        func: 'rotateX',
        rotation: -Math.PI / 2,
        translation: {
          x: 0.5,
          y: 1,
          z: 0.5
        }
      },
      pz: {
        func: null,
        rotation: null,
        translation: {
          x: 0.5,
          y: 0.5,
          z: 1
        }
      },
      nx: {
        func: 'rotateY',
        rotation: -Math.PI / 2,
        translation: {
          x: 0,
          y: 0.5,
          z: 0.5
        }
      },
      ny: {
        func: 'rotateX',
        rotation: Math.PI / 2,
        translation: {
          x: 0.5,
          y: 0,
          z: 0.5
        }
      },
      nz: {
        func: 'rotateY',
        rotation: Math.PI,
        translation: {
          x: 0.5,
          y: 0.5,
          z: 0
        }
      }
    }
  }
}

export default resources
