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
		if (quads === undefined || quads.length === 0) return []

		// const quads = quads || this.genQuads()

		/**
		 * Internal functions for convenience
		 */
		const mapVecToWorld = vec => [
			this.origin.x * size * dimension + (vec[0] - 1) * dimension,
			this.origin.y * size * dimension + (vec[2] - 1) * dimension,
			this.origin.z * size * dimension + (vec[1] - 1) * dimension
		]
		const pushVertices = (geo, arr) =>
			(geo.vertices = arr.map(v => new THREE.Vector3(...mapVecToWorld(v))))

		const meshes = []

		for (let quad of quads) {
			const [v0, v1, v2, v3, type, axis, sMax, tMax] = quad

			const { side, top } = this.materialManager.get(type)

			const geo = new THREE.Geometry()

			let material
			switch (axis) {
				case 0:
					material = side
					pushVertices(geo, [v0, v1, v2, v3])
					break
				case 1:
					material = side
					pushVertices(geo, [v3, v0, v1, v2])
					break
				default:
					material = top
					pushVertices(geo, [v0, v1, v2, v3])
					break
			}

			geo.faces.push(new THREE.Face3(0, 1, 3), new THREE.Face3(1, 2, 3))

			Helpers.boxUnwrapUVs(geo)
			Helpers.updateTextureParams(geo, 0, sMax, 0, tMax)

			geo.computeFaceNormals()

			const mesh = new THREE.Mesh(geo, material)

			meshes.push(mesh)
		}

		return meshes
	}

	/** Calculate mesh and merge them together */
	combineMesh = async meshes => {
		// console.time('Block Combination')
		this.mesh = Helpers.mergeMeshes(meshes)
		this.mesh.name = this.name
		this.mesh.isChunk = true
		// console.timeEnd('Block Combination')
	}

	setGrid = blocks => (this.grid.data = blocks)

	getMesh = () => this.mesh
	mark = () => (this.isLoaded = true)
	unmark = () => (this.isLoaded = false)

	getChunkRepresentation = () =>
		Helpers.getCoordsRepresentation(this.origin.x, this.origin.y, this.origin.z)
}

export default Chunk
