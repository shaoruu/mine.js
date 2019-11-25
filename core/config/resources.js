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
          transparent: false
        }
      },
      2: {
        top: require('../assets/blocks/grass_top.png'),
        side: require('../assets/blocks/grass_side.png'),
        bottom: require('../assets/blocks/dirt.png'),
        config: {
          transparent: false
        }
      },
      3: {
        top: require('../assets/blocks/dirt.png'),
        side: require('../assets/blocks/dirt.png'),
        bottom: require('../assets/blocks/dirt.png'),
        config: {
          transparent: false
        }
      },
      7: {
        top: require('../assets/blocks/bedrock.png'),
        side: require('../assets/blocks/bedrock.png'),
        bottom: require('../assets/blocks/bedrock.png'),
        config: {}
      },
      9: {
        top: require('../assets/blocks/water_still.png'),
        side: require('../assets/blocks/water_still.png'),
        bottom: require('../assets/blocks/water_still.png'),
        config: {
          transparent: true,
          side: THREE.DoubleSide,
          alphaTest: 0.15,
          opacity: 0.4
        }
      },
      12: {
        top: require('../assets/blocks/sand.png'),
        side: require('../assets/blocks/sand.png'),
        bottom: require('../assets/blocks/sand.png'),
        config: {
          transparent: false
        }
      },
      17: {
        top: require('../assets/blocks/log_oak_top.png'),
        side: require('../assets/blocks/log_oak.png'),
        bottom: require('../assets/blocks/log_oak_top.png'),
        config: {
          transparent: false
        }
      },
      18: {
        top: require('../assets/blocks/leaves_oak.png'),
        side: require('../assets/blocks/leaves_oak.png'),
        bottom: require('../assets/blocks/leaves_oak.png'),
        config: {
          side: THREE.DoubleSide,
          color: 0x1f6b1e,
          alphaTest: 0.15
        }
      },
      31: {
        top: null,
        side: require('../assets/blocks/tallgrass.png'),
        bottom: null,
        config: {
          side: THREE.DoubleSide,
          color: 0x6eb219,
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
        rotation: Math.PI / 2,
        translation: {
          x: 0,
          y: 0.5,
          z: 0.5
        }
      },
      ny: {
        func: 'rotateX',
        rotation: -Math.PI / 2,
        translation: {
          x: 0.5,
          y: 0,
          z: 0.5
        }
      },
      nz: {
        func: null,
        rotation: null,
        translation: {
          x: 0.5,
          y: 0.5,
          z: 0
        }
      },
      px2: {
        func: ['rotateY', 'rotateX'],
        rotation: [Math.PI / 2, Math.PI / 2],
        translation: {
          x: 1,
          y: 0.5,
          z: 0.5
        }
      },
      py2: {
        func: ['rotateX', 'rotateY'],
        rotation: [-Math.PI / 2, Math.PI / 2],
        translation: {
          x: 0.5,
          y: 1,
          z: 0.5
        }
      },
      pz2: {
        func: 'rotateZ',
        rotation: Math.PI / 2,
        translation: {
          x: 0.5,
          y: 0.5,
          z: 1
        }
      },
      nx2: {
        func: ['rotateY', 'rotateX'],
        rotation: [Math.PI / 2, Math.PI / 2],
        translation: {
          x: 0,
          y: 0.5,
          z: 0.5
        }
      },
      ny2: {
        func: ['rotateX', 'rotateY'],
        rotation: [-Math.PI / 2, Math.PI / 2],
        translation: {
          x: 0.5,
          y: 0,
          z: 0.5
        }
      },
      nz2: {
        func: 'rotateZ',
        rotation: Math.PI / 2,
        translation: {
          x: 0.5,
          y: 0.5,
          z: 0
        }
      },
      cross1: {
        func: 'rotateY',
        rotation: Math.PI / 4,
        translation: {
          x: 0.5,
          y: 0.5,
          z: 0.5
        }
      },
      cross2: {
        func: ['rotateZ', 'rotateY'],
        rotation: [Math.PI / 2, -Math.PI / 4],
        translation: {
          x: 0.5,
          y: 0.5,
          z: 0.5
        }
      }
    }
  },
  interface: {
    armor: {
      heart: {
        full: require('../assets/interface/heart_full.png'),
        mid: require('../assets/interface/heart_50.png'),
        empty: require('../assets/interface/heart_clear.png')
      },
      armor: {
        full: require('../assets/interface/armor_full.png'),
        mid: require('../assets/interface/armor_50.png'),
        empty: require('../assets/interface/armor_clear.png')
      },
      hunger: {
        full: require('../assets/interface/hunger_full.png'),
        mid: require('../assets/interface/hunger_50.png'),
        empty: require('../assets/interface/hunger_clear.png')
      }
    }
  }
}

export default resources
