import ndarray from 'ndarray'
import * as THREE from 'three'

import Config from '../../../../Data/Config'
import Helpers from '../../../../Utils/Helpers'

const size = Config.chunk.size,
	dimension = Config.block.dimension

class Chunk {
	constructor(materialManager, { origin, blocks }) {
		// Inheritted Managers
		this.materialManager = materialManager

		// Member Initialization
		this.origin = origin
		this.mesh = null
		this.name = this.getChunkRepresentation()

		// grid system of chunk
		const arr = new Uint16Array(size * size * size)
		this.grid = new ndarray(arr, [size, size, size])

		this.isLoaded = false

		this.init(blocks)
	}

	/**
	 * Register block data onto grid
	 * @param {array} blocks - Array of blocks to initialze chunk.
	 */
	init = blocks => {
		for (let block of blocks) {
			const {
				id,
				position: { x, y, z }
			} = block

			this.grid.set(x, z, y, id)
		}
	}

	/**
	 * Generates Quads in greedy mode.
	 * [source]{@link https://github.com/mikolalysenko/mikolalysenko.github.com/blob/gh-pages/MinecraftMeshes/js/greedy.js}
	 */
	genQuads = () => {
		const volume = this.grid,
			dims = [size, size, size]

		const f = (i, j, k) => {
			return volume.get(i, j, k)
		}
		//Sweep over 3-axes
		let quads = []
		for (let d = 0; d < 3; ++d) {
			let i,
				j,
				k,
				l,
				w,
				h,
				u = (d + 1) % 3,
				v = (d + 2) % 3,
				x = [0, 0, 0],
				q = [0, 0, 0],
				mask = new Int32Array(dims[u] * dims[v])
			q[d] = 1
			for (x[d] = -1; x[d] < dims[d]; ) {
				//Compute mask
				let n = 0
				for (x[v] = 0; x[v] < dims[v]; ++x[v])
					for (x[u] = 0; x[u] < dims[u]; ++x[u]) {
						/*eslint eqeqeq: ["off"]*/
						mask[n++] =
							(0 <= x[d] ? f(x[0], x[1], x[2]) : false) !=
							(x[d] < dims[d] - 1
								? f(x[0] + q[0], x[1] + q[1], x[2] + q[2])
								: false)
					}
				//Increment x[d]
				++x[d]
				//Generate mesh for mask using lexicographic ordering
				n = 0
				for (j = 0; j < dims[v]; ++j)
					for (i = 0; i < dims[u]; ) {
						if (mask[n]) {
							//Compute width
							for (w = 1; mask[n + w] && i + w < dims[u]; ++w) {}
							//Compute height (this is slightly awkward
							let done = false
							for (h = 1; j + h < dims[v]; ++h) {
								for (k = 0; k < w; ++k) {
									if (!mask[n + k + h * dims[u]]) {
										done = true
										break
									}
								}
								if (done) {
									break
								}
							}
							//Add quad
							x[u] = i
							x[v] = j
							let du = [0, 0, 0]
							du[u] = w
							let dv = [0, 0, 0]
							dv[v] = h
							quads.push([
								[x[0], x[1], x[2]],
								[x[0] + du[0], x[1] + du[1], x[2] + du[2]],
								[
									x[0] + du[0] + dv[0],
									x[1] + du[1] + dv[1],
									x[2] + du[2] + dv[2]
								],
								[x[0] + dv[0], x[1] + dv[1], x[2] + dv[2]],
								mask[n], // block type
								d // axis
							])
							//Zero-out mask
							for (l = 0; l < h; ++l)
								for (k = 0; k < w; ++k) {
									mask[n + k + l * dims[u]] = false
								}
							//Increment counters and continue
							i += w
							n += w
						} else {
							++i
							++n
						}
					}
			}
		}
		return quads
	}

	/** Generate THREE meshes and store them into an array. */
	meshQuads = () => {
		const quads = this.genQuads()

		/**
		 * Internal functions for convenience
		 */
		const mapVecToWorld = vec => [
			this.origin.x * size * dimension + vec[0] * dimension,
			this.origin.y * size * dimension + vec[2] * dimension,
			this.origin.z * size * dimension + vec[1] * dimension
		]
		const pushVertices = (geo, arr) =>
			(geo.vertices = arr.map(v => new THREE.Vector3(...mapVecToWorld(v))))

		const meshes = []

		for (let quad of quads) {
			const [v0, v1, v2, v3, type, axis] = quad
			const { side, top } = this.materialManager.get(type)

			const geo = new THREE.Geometry()

			let material, sMax, tMax
			switch (axis) {
				case 0:
					material = side
					pushVertices(geo, [v0, v1, v2, v3])
					sMax = Helpers.calcDis(v0, v1)
					tMax = Helpers.calcDis(v1, v2)
					break
				case 1:
					material = side
					pushVertices(geo, [v1, v2, v3, v0])
					sMax = Helpers.calcDis(v1, v2)
					tMax = Helpers.calcDis(v0, v1)
					break
				default:
					material = top
					pushVertices(geo, [v0, v1, v2, v3])
					sMax = Helpers.calcDis(v0, v1)
					tMax = Helpers.calcDis(v1, v2)
					break
			}

			geo.faces.push(new THREE.Face3(0, 1, 3), new THREE.Face3(1, 2, 3))

			Helpers.boxUnwrapUVs(geo)
			Helpers.updateTextureParams(geo, 0, sMax, 0, tMax)

			const mesh = new THREE.Mesh(geo, material)

			meshes.push(mesh)
		}

		return meshes
	}

	/** Calculate mesh and merge them together */
	combineMesh = () => {
		// console.time('Block Combination')
		this.mesh = Helpers.mergeMeshes(this.meshQuads())
		this.mesh.name = this.name
		this.mesh.isChunk = true
		// console.timeEnd('Block Combination')
	}

	getMesh = () => this.mesh
	mark = () => (this.isLoaded = true)
	unmark = () => (this.isLoaded = false)

	getChunkRepresentation = () =>
		Helpers.getChunkRepresentation(this.origin.x, this.origin.y, this.origin.z)
}

export default Chunk
