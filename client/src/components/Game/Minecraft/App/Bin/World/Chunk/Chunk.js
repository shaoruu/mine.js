import Config from '../../../../Data/Config'
import Helpers from '../../../../Utils/Helpers'
import Block from './Block/Block'

const size = Config.chunk.size,
	dimension = Config.block.dimension,
	height = Config.chunk.height

class Chunk {
	constructor({ origin, blocks }) {
		// Member Initialization
		this.origin = origin
		this.meshGroup = [] // Collection of all block meshes
		this.grid = null
		this.mesh = null

		this.init(blocks)
	}

	init = blocks => {
		/**
		 * Initialize grid as 16x16x128
		 */
		this.grid = new Array(size)
		for (let x = 0; x < size; x++) {
			this.grid[x] = new Array(size)
			for (let z = 0; z < size; z++)
				// Initially fill chunk columns with air
				this.grid[x][z] = new Array(height).fill(0)
		}

		/**
		 * Registering block data onto grid
		 */
		for (let block of blocks) {
			const {
				id,
				position: { x, y, z }
			} = block

			// TODO: Add more data about the block to the grid
			this.grid[x][z][y] = {
				id
			}
		}

		/**
		 * Generating individual block meshes
		 */
		for (let x = 0; x < size; x++)
			for (let z = 0; z < size; z++)
				for (let y = 0; y < height; y++) {
					if (!this.grid[x][z][y]) continue
					const { id } = this.grid[x][z][y]
					const tempBlock = this._getEmptyBlock(
						id,
						this.origin.x * dimension * size + x * dimension,
						y * dimension,
						this.origin.z * dimension * size + z * dimension
					)

					const specifics = {
						top: y === height - 1 || !Boolean(this.grid[x][z][y + 1].id),
						bottom: y === 0 || !Boolean(this.grid[x][z][y - 1].id),
						sides: [
							z === size - 1 || !Boolean(this.grid[x][z + 1][y].id),
							x === size - 1 || !Boolean(this.grid[x + 1][z][y].id),
							z === 0 || !Boolean(this.grid[x][z - 1][y].id),
							x === 0 || !Boolean(this.grid[x - 1][z][y].id)
						]
					}

					this.meshGroup.push(...tempBlock.getTotalMesh(specifics))
				}

		/**
		 * Combining them all together
		 */
		this._handleMeshCombining()
	}

	_handleMeshCombining = () => {
		this.mesh = Helpers.mergeMeshes(this.meshGroup)
		// TODO: this.mesh.name =
	}
	_getEmptyBlock = (id, x, y, z) => new Block(id, x, y, z)
}

export default Chunk
