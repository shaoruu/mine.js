import Config from '../../../../Data/Config'
import Helpers from '../../../../Utils/Helpers'
import Block from './Block/Block'
import BlockMaterials from './Block/BlockMaterials'
import BlockModels from './Block/BlockModels'

const size = Config.chunk.size,
	dimension = Config.block.dimension,
	height = Config.chunk.height

class Chunk {
	constructor(
		{ origin, blocks },
		{ north = null, south = null, east = null, west = null } = {}
	) {
		// Member Initialization
		this.origin = origin
		this.meshGroup = [] // Collection of all block meshes
		this.grid = null
		this.mesh = null
		this.name = this.getChunkRepresentation()

		this.blockMaterials = new BlockMaterials()
		this.blockModels = new BlockModels()

		this.isLoaded = false

		// Represents the chunks nearby
		this.neighbors = {
			north,
			south,
			east,
			west
		}

		this.loadTextures()
		this.init(blocks)
	}

	loadTextures = () => {
		for (let key in Config.textures)
			this.blockMaterials.load(key, Config.textures[key])
	}

	init = blocks => {
		/**
		 * Initialize grid as 16x16x128
		 */
		// console.time('Block Initialization')
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
		// console.timeEnd('Block Initialization')
	}

	calculate = async () => {
		// Resetting meshGroup to refresh chunk
		this.meshGroup = []
		/**
		 * Generating individual block meshes
		 */

		// console.time('Block Calculation')
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

					const { north, south, east, west } = this.neighbors

					const specifics = {
						top: y === height - 1 || !Boolean(this.grid[x][z][y + 1].id),
						bottom: y === 0 || !Boolean(this.grid[x][z][y - 1].id),
						sides: [
							z === size - 1
								? north
									? !Boolean(north.grid[x][0][y])
									: false
								: !Boolean(this.grid[x][z + 1][y].id),
							x === size - 1
								? east
									? !Boolean(east.grid[0][z][y])
									: false
								: !Boolean(this.grid[x + 1][z][y].id),
							z === 0
								? south
									? !Boolean(south.grid[x][size - 1][y])
									: false
								: !Boolean(this.grid[x][z - 1][y].id),
							x === 0
								? west
									? !Boolean(west.grid[size - 1][z][y])
									: false
								: !Boolean(this.grid[x - 1][z][y].id)
						]
					}

					this.meshGroup.push(
						...tempBlock.getTotalMesh(specifics, this.blockMaterials.get(id))
					)
				}
		// console.timeEnd('Block Calculation')
	}

	combineMesh = async () => {
		// console.time('Block Combination')
		this.mesh = Helpers.mergeMeshes(this.meshGroup)
		this.mesh.name = this.name
		this.mesh.isChunk = true
		// console.timeEnd('Block Combination')
	}

	getMeshGroup = () => this.meshGroup
	getMesh = () => this.mesh

	mark = () => (this.isLoaded = true)
	unmark = () => (this.isLoaded = false)

	setNorth = chunk => (this.neighbors.north = chunk)
	setSouth = chunk => (this.neighbors.south = chunk)
	setEast = chunk => (this.neighbors.east = chunk)
	setWest = chunk => (this.neighbors.west = chunk)

	getChunkRepresentation = () =>
		Helpers.getChunkRepresentation(this.origin.x, this.origin.z)

	_handleMeshCombining = () => (this.mesh = Helpers.mergeMeshes(this.meshGroup))

	_getEmptyBlock = (id, x, y, z) => new Block(id, x, y, z)
}

export default Chunk
