import Config from '../../../Data/Config'
import Chunk from './Chunk/Chunk'

class World {
	constructor(worldData) {
		const { seed, name, chunks } = worldData

		this.chunkDimension = Config.chunk.size * Config.block.dimension

		this.seed = seed
		this.name = name

		this.chunks = this._digestChunks(chunks)
	}

	init = scene => {
		this.chunks.forEach(c => {
			scene.add(c.mesh)
		})
	}

	_digestChunks = chunks => {
		let temp = []
		for (let chunk of chunks) {
			const { blocks, coordx, coordz } = chunk

			temp.push(
				new Chunk({
					origin: {
						x: coordx,
						z: coordz
					},
					blocks: blocks
						.slice(0, -1)
						.split(';')
						.map(og => {
							const ele = og.split(':')
							const id = parseInt(ele[0])
							const coords = ele[1].split(','),
								position = {
									x: parseInt(coords[0]),
									y: parseInt(coords[1]),
									z: parseInt(coords[2])
								}
							return {
								id,
								position
							}
						})
				})
			)
		}
		return temp
	}
}

export default World
