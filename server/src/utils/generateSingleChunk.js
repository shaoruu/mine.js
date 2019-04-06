import generateSingleBlock from './generateSingleBlock'
import Noise from '../bin/Noise'
import Config from '../data/Config'

export default (seed, posx, posz) => {
	// const biome = new Biome(seed)
	const noise = new Noise(seed)

	const size = Config.chunk.size,
		height = Config.chunk.height,
		maxHeight = Config.chunk.maxHeight,
		// waterLevel = Config.chunk.waterLevel,
		noiseConstant = 10

	let blocks = ''

	// Basic stone
	for (let x = 0; x < size; x++) {
		for (let z = 0; z < size; z++) {
			// Generating solids
			let top

			for (let y = 0; y < height; y++) {
				let id = 0
				let density = noise.perlin2(
					(x + posx * size) / noiseConstant,
					(z + posz * size) / noiseConstant,
					y / noiseConstant
				)
				if (density >= 0) {
					id = 1
					top = y
				}
				blocks += generateSingleBlock(id, { x, y, z })
			}

			const groundHeight = Math.round(
				(noise.perlin2(
					(x + posx * size) / noiseConstant,
					(z + posz * size) / noiseConstant
				) +
					1) *
					height
			)

			top += 1

			for (let y = top; y < top + groundHeight; y++) {
				blocks += generateSingleBlock(1, { x, y, z })
			}

			// Filling up the rest with air
			for (let y = top + groundHeight; y < maxHeight; y++)
				blocks += generateSingleBlock(0, { x, y, z })
		}
	}

	// // Adding 2D perlin noise (dirt and sand)
	// for (let x = 0; x < size; x++) {
	// 	for (let z = 0; z < size; z++) {
	// 		let topBlocks = { top: 2, bottom: 3 }
	// 		if (biome.getBiome(x + posx * size, z + posz * size) === 2)
	// 			topBlocks = { top: 12, bottom: 12 }

	// 		const groundHeight = Math.round(
	// 			(noise.perlin2(
	// 				(x + posx * size) / noiseConstant,
	// 				(z + posz * size) / noiseConstant
	// 			) +
	// 				1) *
	// 				height
	//         )
	//         let top = 0

	// 	}
	// }

	return {
		blocks,
		coordx: posx,
		coordz: posz
	}
}
