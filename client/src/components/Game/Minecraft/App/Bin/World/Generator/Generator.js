/** AUTHOR: https://github.com/mrprokoala */
import Noise from './Noise'
import Config from '../../../../Data/Config'

const noiseConstant = Config.world.noiseConstant,
	height = Config.chunk.height

class Generator {
	constructor(seed) {
		this.noise = new Noise(seed)
	}

	getBlockInfo = (x, y, z) => {
		let blockId = 0
		if (y <= height / 2) {
			blockId = 1
		} else {
			let x2 = x / noiseConstant
			let y2 = y / noiseConstant
			let z2 = z / noiseConstant

			let value = this.linearInterpolate3d(
				this.getNoise(x2, y2, z2),
				this.getNoise(x2 + 1 / noiseConstant, y2, z2),
				this.getNoise(x2, y2 + 1 / noiseConstant, z2),
				this.getNoise(x2 + 1 / noiseConstant, y2 + 1 / noiseConstant, z2),
				this.getNoise(x2, y2, z2 + 1 / noiseConstant),
				this.getNoise(x2 + 1 / noiseConstant, y2, z2 + 1 / noiseConstant),
				this.getNoise(x2, y2 + 1 / noiseConstant, z2 + 1 / noiseConstant),
				this.getNoise(
					x2 + 1 / noiseConstant,
					y2 + 1 / noiseConstant,
					z2 + 1 / noiseConstant
				),
				x2,
				y2,
				z2
			)
			if (value >= -0.5) {
				blockId = 1
			}
		}
		return blockId
	}

	linearInterpolate3d = (
		xm_ym_zm,
		xp_ym_zm,
		xm_yp_zm,
		xp_yp_zm,
		xm_ym_zp,
		xp_ym_zp,
		xm_yp_zp,
		xp_yp_zp,
		x,
		y,
		z
	) =>
		xm_ym_zm * (1 - x) * (1 - y) * (1 - z) +
		xp_ym_zm * x * (1 - y) * (1 - z) +
		xm_yp_zm * (1 - x) * y * (1 - z) +
		xp_yp_zm * x * y * (1 - z) +
		xm_ym_zp * (1 - x) * (1 - y) * z +
		xp_ym_zp * x * (1 - y) * z +
		xm_yp_zp * (1 - x) * y * z +
		xp_yp_zp * x * y * z

	getNoise = (x, y, z) =>
		this.noise.perlin3(x, y, z) - (y * noiseConstant * 2) / height + 1
}

export default Generator
