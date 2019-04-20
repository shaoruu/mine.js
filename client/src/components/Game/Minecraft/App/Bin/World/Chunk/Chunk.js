import ndarray from 'ndarray'
import * as THREE from 'three'

import Config from '../../../../Data/Config'
import Helpers from '../../../../Utils/Helpers'

const size = Config.chunk.size,
	dimension = Config.block.dimension

class Chunk {
	constructor(materialManager, { origin }) {
		// Inheritted Managers
		this.materialManager = materialManager

		// Member Initialization
		this.origin = origin
		this.mesh = null
		this.name = this.getChunkRepresentation()
		this.loading = true

		// Grid System of Chunk
		const arr = new Uint16Array((size + 2) * (size + 2) * (size + 2))
		this.grid = new ndarray(arr, [size + 2, size + 2, size + 2])

		this.isLoaded = false

		this.blocksInProgress = {}
	}

	/**
	 * Register block data onto grid
	 * @param {array} blocks - Array of blocks to initialze chunk.
	 */
	initGrid = blocks => {
		for (let block of blocks) {
			const {
				id,
				position: { x, y, z }
			} = block

			this.grid.set(x, z, y, id)
		}
	}

	/** Generate THREE meshes and store them into an array. */
	meshQuads = quads => {
		// Avoiding extra work.
		if (quads === undefined || quads.length === 0) return null

		// const quads = quads || this.genQuads()

		/**
		 * Internal functions for convenience
		 */
		const mapVecToWorld = vec => [
			this.origin.x * size * dimension + (vec[0] - 1) * dimension,
			this.origin.y * size * dimension + (vec[1] - 1) * dimension,
			this.origin.z * size * dimension + (vec[2] - 1) * dimension
		]

		const meshes = []

		for (let quad of quads) {
			const [coords, rotation, type, material] = quad

			const geo = new THREE.PlaneGeometry(dimension, dimension)
			geo.computeFaceNormals()

			const meshMat = this.materialManager.get(type)[material]

			const mesh = new THREE.Mesh(geo, meshMat)

			if (rotation) mesh[rotation[0]](rotation[1])

			const globalCoords = mapVecToWorld(coords)
			mesh.position.set(...globalCoords)

			meshes.push(mesh)
		}

		return meshes
	}

	/** Calculate mesh and merge them together */
	combineMesh = async meshes => {
		// console.time('Block Combination')
		if (!meshes) return

		this.mesh = Helpers.mergeMeshes(meshes)
		this.mesh.name = this.name
		this.mesh.isChunk = true
		// console.timeEnd('Block Combination')
	}

	setGrid = blocks => (this.grid.data = blocks)

	setBlock = (x, y, z, val) => this.grid.set(x + 1, z + 1, y + 1, val)

	getBlock = (x, y, z) => this.grid.get(x + 1, z + 1, y + 1) // avoid passing in neighbors
	getMesh = () => this.mesh
	mark = () => (this.isLoaded = true)
	unmark = () => (this.isLoaded = false)

	checkBusyBlock = (x, y, z) =>
		this.blocksInProgress[Helpers.getCoordsRepresentation(x, y, z)]
	tagBusyBlock = (x, y, z) =>
		(this.blocksInProgress[Helpers.getCoordsRepresentation(x, y, z)] = true)
	untagBusyBlock = (x, y, z) =>
		delete this.blocksInProgress[Helpers.getCoordsRepresentation(x, y, z)]

	getChunkRepresentation = () =>
		Helpers.getCoordsRepresentation(this.origin.x, this.origin.y, this.origin.z)
}

export default Chunk
