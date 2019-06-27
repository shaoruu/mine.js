// RESOURCE PACK SOURCE: https://www.planetminecraft.com/texture_pack/modern-hd-pack-64x-ctm-better-skies/

export default {
  geometries: {
    block: {
      px: {
        func: 'rotateY',
        rotation: Math.PI / 2
      },
      py: {
        func: 'rotateX',
        rotation: -Math.PI / 2
      },
      pz: {
        func: null,
        rotation: null
      },
      nx: {
        func: 'rotateY',
        rotation: Math.PI / 2
      },
      ny: {
        func: 'rotateX',
        rotation: -Math.PI / 2
      },
      nz: {
        func: null,
        rotation: null
      },
      px2: {
        func: ['rotateY', 'rotateX'],
        rotation: [Math.PI / 2, Math.PI / 2]
      },
      py2: {
        func: ['rotateX', 'rotateY'],
        rotation: [-Math.PI / 2, Math.PI / 2]
      },
      pz2: {
        func: 'rotateZ',
        rotation: Math.PI / 2
      },
      nx2: {
        func: ['rotateY', 'rotateX'],
        rotation: [Math.PI / 2, Math.PI / 2]
      },
      ny2: {
        func: ['rotateX', 'rotateY'],
        rotation: [-Math.PI / 2, Math.PI / 2]
      },
      nz2: {
        func: 'rotateZ',
        rotation: Math.PI / 2
      }
    }
  },
  textures: {
    gui: {
      crosshair: require('../../../../../assets/gui/crosshair.png')
    },
    blocks: {
      1: {
        side: require('../../../../../assets/blocks/stone.png'),
        top: require('../../../../../assets/blocks/stone.png'),
        bottom: require('../../../../../assets/blocks/stone.png')
      },
      2: {
        side: require('../../../../../assets/blocks/grass_block_side.png'),
        top: require('../../../../../assets/blocks/grass_block_top.png'),
        bottom: require('../../../../../assets/blocks/dirt.png')
      },
      3: {
        side: require('../../../../../assets/blocks/dirt.png'),
        top: require('../../../../../assets/blocks/dirt.png'),
        bottom: require('../../../../../assets/blocks/dirt.png')
      },
      12: {
        side: require('../../../../../assets/blocks/sand.png'),
        top: require('../../../../../assets/blocks/sand.png'),
        bottom: require('../../../../../assets/blocks/sand.png')
      },
      17: {
        side: require('../../../../../assets/blocks/oak_log.png'),
        top: require('../../../../../assets/blocks/oak_log_top.png'),
        bottom: require('../../../../../assets/blocks/oak_log_top.png')
      },
      18: {
        side: require('../../../../../assets/blocks/oak_leaves.png'),
        top: require('../../../../../assets/blocks/oak_leaves.png'),
        bottom: require('../../../../../assets/blocks/oak_leaves.png')
      },
      89: {
        side: require('../../../../../assets/blocks/glowstone.png'),
        top: require('../../../../../assets/blocks/glowstone.png'),
        bottom: require('../../../../../assets/blocks/glowstone.png')
      },
      57: {
        side: require('../../../../../assets/blocks/diamond_block.png'),
        top: require('../../../../../assets/blocks/diamond_block.png'),
        bottom: require('../../../../../assets/blocks/diamond_block.png')
      },
      80: {
        side: require('../../../../../assets/blocks/snow.png'),
        top: require('../../../../../assets/blocks/snow.png'),
        bottom: require('../../../../../assets/blocks/snow.png')
      },
      81: {
        side: require('../../../../../assets/blocks/cactus_side.png'),
        top: require('../../../../../assets/blocks/cactus_top.png'),
        bottom: require('../../../../../assets/blocks/cactus_bottom.png')
      },
      95: {
        side: require('../../../../../assets/blocks/blue_stained_glass.png'),
        top: require('../../../../../assets/blocks/blue_stained_glass.png'),
        bottom: require('../../../../../assets/blocks/blue_stained_glass.png')
      }
    },
    specialBlocks: {
      breaking: {
        0: require('../../../../../assets/blocks/destroy_stage_0.png'),
        1: require('../../../../../assets/blocks/destroy_stage_1.png'),
        2: require('../../../../../assets/blocks/destroy_stage_2.png'),
        3: require('../../../../../assets/blocks/destroy_stage_3.png'),
        4: require('../../../../../assets/blocks/destroy_stage_4.png'),
        5: require('../../../../../assets/blocks/destroy_stage_5.png'),
        6: require('../../../../../assets/blocks/destroy_stage_6.png'),
        7: require('../../../../../assets/blocks/destroy_stage_7.png'),
        8: require('../../../../../assets/blocks/destroy_stage_8.png')
      }
    }
  }
}
