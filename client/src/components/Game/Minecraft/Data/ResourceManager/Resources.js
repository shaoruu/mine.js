// TODO: move texture loading over
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
				rotation: -Math.PI / 2
			},
			ny: {
				func: 'rotateX',
				rotation: Math.PI / 2
			},
			nz: {
				func: 'rotateY',
				rotation: Math.PI
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
				side: require('../../../../../assets/blocks/grass_side.png'),
				top: require('../../../../../assets/blocks/grass_top.png'),
				bottom: require('../../../../../assets/blocks/dirt.png')
			},
			3: {
				side: require('../../../../../assets/blocks/dirt.png'),
				top: require('../../../../../assets/blocks/dirt.png'),
				bottom: require('../../../../../assets/blocks/dirt.png')
			},
			8: {
				side: require('../../../../../assets/blocks/water_flow.png'),
				top: require('../../../../../assets/blocks/water_flow.png'),
				bottom: require('../../../../../assets/blocks/water_flow.png')
			},
			12: {
				side: require('../../../../../assets/blocks/sand.png'),
				top: require('../../../../../assets/blocks/sand.png'),
				bottom: require('../../../../../assets/blocks/sand.png')
			},
			17: {
				side: require('../../../../../assets/blocks/log_oak.png'),
				top: require('../../../../../assets/blocks/log_oak_top.png'),
				bottom: require('../../../../../assets/blocks/log_oak_top.png')
			},
			18: {
				side: require('../../../../../assets/blocks/leaves_oak.png'),
				top: require('../../../../../assets/blocks/leaves_oak.png'),
				bottom: require('../../../../../assets/blocks/leaves_oak.png')
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
			}
		}
	}
}
