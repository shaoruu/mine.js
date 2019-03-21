import generateSingleBlock from './generateSingleBlock'

export default (posx, posz, size, height) => {
	let blocks = ''
	for (let x = 0; x < size; x++) {
		for (let z = 0; z < size; z++) {
			// const maxHeight = Math.random() * 160 + 100
			for (let y = 0; y < height; y++) {
				blocks += generateSingleBlock(1, { x: posx + x, y, z: posz + z })
			}
		}
	}
	return {
		blocks,
		coordx: posx,
		coordz: posz
	}
}
