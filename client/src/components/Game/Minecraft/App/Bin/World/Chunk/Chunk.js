import ndarray from 'ndarray'
import compileMesher from 'greedy-mesher'
import * as THREE from 'three'

import Config from '../../../../Data/Config'
import Helpers from '../../../../Utils/Helpers'
import Block from './Block/Block'
import BlockMaterials from './Block/BlockMaterials'

const size = Config.chunk.size,
	dimension = Config.block.dimension,
	height = Config.chunk.height

class Chunk {
	constructor(
		materialManager,
		{ origin, blocks },
		{ north = null, south = null, east = null, west = null } = {}
	) {
		// Inheritted Managers
		this.materialManager = materialManager

		// Member Initialization
		this.origin = origin
		this.meshGroup = [] // Collection of all block meshes
		this.mesh = null
		this.name = this.getChunkRepresentation()

		// grid system of chunk
		const arr = new Uint16Array(size * size * height)
		this.grid = new ndarray(arr, [size, size, height])

		// mesher
		this.mesher = compileMesher({
			order: [0, 0, 1],
			extraArgs: 1,
			skip: val => val === 0,
			append: (lo_x, lo_z, lo_y, hi_x, hi_z, hi_y, val, result) =>
				result.push([[lo_x, lo_z, lo_y], [hi_x, hi_z, hi_y], val])
		})

		this.blockMaterials = new BlockMaterials()

		this.isLoaded = false

		// Represents the chunks nearby
		this.neighbors = {
			north,
			south,
			east,
			west
		}

		this.init(blocks)
	}

	init = blocks => {
		/**
		 * Registering block data onto grid
		 */
		for (let block of blocks) {
			const {
				id,
				position: { x, y, z }
			} = block

			this.grid.set(x, z, y, id)
		}
	}

	// test = () => {
	// 	const res = []
	// 	this.mesher(this.grid, res)
	// 	console.log(res)
	// }

	/**
	 * Generates Quads in greedy mode.
	 * @source: https://github.com/mikolalysenko/mikolalysenko.github.com/blob/gh-pages/MinecraftMeshes/js/greedy.js
	 */
	genQuads = () => {
		const volume = this.grid,
			dims = [size, size, height]

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

	meshQuads = () => {
		/**
		 * Sample Quad:
		 * [[1, 1, 0],
		 *  [1, 0, 0],
		 *  [0, 1, 0],
		 *  [0, 0, 0]]
		 *  => form a [1, 1, 1] square near (0, 0, 0)
		 */
		const quads = this.genQuads()

		/**
		 * Internal functions for convenience
		 */
		const adjust = vec => [
			this.origin.x * size * dimension + vec[0] * dimension,
			vec[2] * dimension,
			this.origin.z * size * dimension + vec[1] * dimension
		]
		const boxUnwrapUVs = geometry => {
			if (!geometry.boundingBox) geometry.computeBoundingBox()
			let sz = geometry.boundingBox.getSize(new THREE.Vector3())
			// let center = geometry.boundingBox.getCenter(new THREE.Vector3())
			let min = geometry.boundingBox.min
			if (geometry.faceVertexUvs[0].length === 0) {
				for (let i = 0; i < geometry.faces.length; i++) {
					geometry.faceVertexUvs[0].push([
						new THREE.Vector2(),
						new THREE.Vector2(),
						new THREE.Vector2()
					])
				}
			}
			for (let i = 0; i < geometry.faces.length; i++) {
				// let face = geometry.faces[i]
				let faceUVs = geometry.faceVertexUvs[0][i]
				let va = geometry.vertices[geometry.faces[i].a]
				let vb = geometry.vertices[geometry.faces[i].b]
				let vc = geometry.vertices[geometry.faces[i].c]
				let vab = new THREE.Vector3().copy(vb).sub(va)
				let vac = new THREE.Vector3().copy(vc).sub(va)
				//now we have 2 vectors to get the cross product of...
				let vcross = new THREE.Vector3().copy(vab).cross(vac)
				//Find the largest axis of the plane normal...
				vcross.set(Math.abs(vcross.x), Math.abs(vcross.y), Math.abs(vcross.z))
				let majorAxis =
					vcross.x > vcross.y
						? vcross.x > vcross.z
							? 'x'
							: vcross.y > vcross.z
							? 'y'
							: vcross.y > vcross.z
						: vcross.y > vcross.z
						? 'y'
						: 'z'
				//Take the other two axis from the largest axis
				let uAxis = majorAxis === 'x' ? 'y' : majorAxis === 'y' ? 'x' : 'x'
				let vAxis = majorAxis === 'x' ? 'z' : majorAxis === 'y' ? 'z' : 'y'
				faceUVs[0].set(
					(va[uAxis] - min[uAxis]) / sz[uAxis],
					(va[vAxis] - min[vAxis]) / sz[vAxis]
				)
				faceUVs[1].set(
					(vb[uAxis] - min[uAxis]) / sz[uAxis],
					(vb[vAxis] - min[vAxis]) / sz[vAxis]
				)
				faceUVs[2].set(
					(vc[uAxis] - min[uAxis]) / sz[uAxis],
					(vc[vAxis] - min[vAxis]) / sz[vAxis]
				)
			}
			geometry.elementsNeedUpdate = geometry.verticesNeedUpdate = true
		}
		const updateTextureParams = (geo, sMin, sMax, tMin, tMax) => {
			let elt = geo.faceVertexUvs[0]
			let face0 = elt[0]
			face0[0] = new THREE.Vector2(sMin, tMin)
			face0[1] = new THREE.Vector2(sMax, tMin)
			face0[2] = new THREE.Vector2(sMin, tMax)
			let face1 = elt[1]
			face1[0] = new THREE.Vector2(sMax, tMin)
			face1[1] = new THREE.Vector2(sMax, tMax)
			face1[2] = new THREE.Vector2(sMin, tMax)
			geo.uvsNeedUpdate = true
		}
		const calcDis = (v1, v2) =>
			Math.sqrt(
				Math.abs(v1[0] - v2[0]) * Math.abs(v1[0] - v2[0]) +
					Math.abs(v1[1] - v2[1]) * Math.abs(v1[1] - v2[1]) +
					Math.abs(v1[2] - v2[2]) * Math.abs(v1[2] - v2[2])
			)

		const meshes = []

		for (let quad of quads) {
			const [v0, v1, v2, v3, type, axis] = quad

			const geo = new THREE.Geometry()

			const sMax = calcDis(v0, v1),
				tMax = calcDis(v1, v2)

			geo.faces.push(new THREE.Face3(0, 1, 3), new THREE.Face3(1, 2, 3))

			const { side, top } = this.materialManager.get(type)

			// TODO: FIX THIS UGLY CODE BELOW ˇˇ

			let material
			switch (axis) {
				case 0:
					material = side
					geo.vertices = [
						new THREE.Vector3(...adjust(v0)),
						new THREE.Vector3(...adjust(v1)),
						new THREE.Vector3(...adjust(v2)),
						new THREE.Vector3(...adjust(v3))
					]
					boxUnwrapUVs(geo)
					updateTextureParams(geo, 0, sMax, 0, tMax)
					break
				case 1:
					material = side
					geo.vertices = [
						new THREE.Vector3(...adjust(v1)),
						new THREE.Vector3(...adjust(v2)),
						new THREE.Vector3(...adjust(v3)),
						new THREE.Vector3(...adjust(v0))
					]
					boxUnwrapUVs(geo)
					updateTextureParams(geo, 0, tMax, 0, sMax)
					break
				default:
					material = top
					geo.vertices = [
						new THREE.Vector3(...adjust(v0)),
						new THREE.Vector3(...adjust(v1)),
						new THREE.Vector3(...adjust(v2)),
						new THREE.Vector3(...adjust(v3))
					]
					boxUnwrapUVs(geo)
					updateTextureParams(geo, 0, sMax, 0, tMax)
					break
			}

			// Rotate if

			const mesh = new THREE.Mesh(geo, material)

			meshes.push(mesh)
		}

		return meshes
	}

	calculate = ({ neighbors } = { neighbors: false }) => {
		// Resetting meshGroup to refresh chunk
		if (!neighbors) this.meshGroup = []

		// console.time('Block Calculation')
		for (let x = 0; x < size; x++)
			for (let z = 0; z < size; z++)
				for (let y = 0; y < height; y++) {
					// Neighbor mode
					if (
						neighbors &&
						(x !== 0 &&
							x !== size - 1 &&
							(y !== 0 && y !== size - 1) &&
							(z !== 0 && z !== size - 1))
					)
						continue

					const id = this.grid.get(x, z, y)

					// Dismiss air
					if (id === 0) continue

					const tempBlock = this._getEmptyBlock(
						id,
						this.origin.x * dimension * size + x * dimension,
						y * dimension,
						this.origin.z * dimension * size + z * dimension
					)

					const { north, south, east, west } = this.neighbors

					const specifics = {
						top: y === height - 1 || !Boolean(this.grid.get(x, z, y + 1)),
						bottom: y === 0 || !Boolean(this.grid.get(x, z, y - 1)),
						sides: [
							z === size - 1
								? north
									? !Boolean(north.grid.get(x, 0, y))
									: false
								: !Boolean(this.grid.get(x, z + 1, y)),
							x === size - 1
								? east
									? !Boolean(east.grid.get(0, z, y))
									: false
								: !Boolean(this.grid.get(x + 1, z, y)),
							z === 0
								? south
									? !Boolean(south.grid.get(x, size - 1, y))
									: false
								: !Boolean(this.grid.get(x, z - 1, y)),
							x === 0
								? west
									? !Boolean(west.grid.get(size - 1, z, y))
									: false
								: !Boolean(this.grid.get(x - 1, z, y))
						]
					}

					this.meshGroup.push(
						...tempBlock.getTotalMesh(specifics, this.materialManager.get(id))
					)
				}
		// console.timeEnd('Block Calculation')
	}

	combineMesh = () => {
		// console.time('Block Combination')
		this.mesh = Helpers.mergeMeshes(this.meshQuads())
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
