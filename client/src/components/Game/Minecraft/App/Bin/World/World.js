import * as THREE from 'three'
import Config from '../../../Data/Config'
import Chunk from './Chunk/Chunk'
import Helpers from '../../../Utils/Helpers'
import BlockMaterials from './Chunk/Block/BlockMaterials'

class World {
	constructor(scene, worldData) {
		const { seed, name, chunks } = worldData

		this.chunkDimension = Config.chunk.size * Config.block.dimension

		this.seed = seed
		this.name = name

		// Connections to outer space
		this.scene = scene

		this.mesh = null
		this.chunks = {}

		// Loaders
		this.materialManager = new BlockMaterials()
		this.loadTextures()

		this._digestChunks(chunks)
		// this._generateChunks()
	}

	loadTextures = () => {
		Helpers.log('Loading Textures...')
		for (let key in Config.textures.blocks)
			this.materialManager.load(key, Config.textures.blocks[key])
		Helpers.log('Finished Loading Textures.')
	}

	requestMeshUpdate = ({ x, z }) => {
		// ? PROBABLY SELECT ALL USING CHUNKS FIRST?
		// ? AND PROBABLY CHANGING CHUNKDICTIONARY INTO AN ARRAY?

		const chunkx = Math.floor(x / Config.chunk.size),
			chunkz = Math.floor(z / Config.chunk.size)

		const renderDistance = Config.player.renderDistance

		const isInRange = chunk => {
			return (
				chunk.origin.x <= chunkx + renderDistance &&
				chunk.origin.x >= chunkx - renderDistance &&
				(chunk.origin.z <= chunkz + renderDistance &&
					chunk.origin.z >= chunkz - renderDistance)
			)
		}

		// TODO: CHUNK FACES ARES STILL NOT DETECTED
		const updatedChunks = {}

		for (let i = chunkx - renderDistance; i <= chunkx + renderDistance; i++)
			for (let j = chunkz - renderDistance; j <= chunkz + renderDistance; j++) {
				const tempChunk = this.chunks[Helpers.getChunkRepresentation(i, j)]
				if (!tempChunk) continue
				if (isInRange(tempChunk)) {
					updatedChunks[tempChunk.name] = true
					if (!tempChunk.isLoaded) {
						const mesh = tempChunk.getMesh()
						if (mesh instanceof THREE.Object3D) this.scene.add(mesh)
						tempChunk.mark()
					} else continue // in range and loaded
				} else {
					if (tempChunk.isLoaded) {
						tempChunk.unmark()
						const selectedObj = this.scene.getObjectByName(tempChunk.name)
						this.scene.remove(selectedObj)
					} else continue // out of range and unloaded
				}
			}

		const shouldBeRemoved = []
		this.scene.children.forEach(child => {
			if (!updatedChunks[child.name] && child.isChunk) shouldBeRemoved.push(child)
		})
		shouldBeRemoved.forEach(obj => this.scene.remove(obj))
	}

	registerChunk = chunk => {
		const { blocks, coordx, coordz } = chunk

		if (this.chunks[Helpers.getChunkRepresentation(coordx, coordz)]) return

		// TODO: REWRITE THIS UGLY CODE BELOW
		/**
		 * NORTH = +Z
		 * SOUTH = -Z
		 * EAST  = +X
		 * WEST  = -X
		 */
		const neighbors = {
			north: this.chunks[Helpers.getChunkRepresentation(coordx, coordz + 1)],
			south: this.chunks[Helpers.getChunkRepresentation(coordx, coordz - 1)],
			east: this.chunks[Helpers.getChunkRepresentation(coordx + 1, coordz)],
			west: this.chunks[Helpers.getChunkRepresentation(coordx - 1, coordz)]
		}
		// Creating a chunk instance and providing it with its neighbors
		const newChunk = new Chunk(
			this.materialManager,
			{
				origin: {
					x: coordx,
					z: coordz
				},
				blocks: this._digestBlocks(blocks)
			},
			{
				...neighbors
			}
		)

		// Knitting instance to neighbors
		if (neighbors.north) {
			neighbors.north.setSouth(newChunk)
			neighbors.north.combineMesh()
		}
		if (neighbors.south) {
			neighbors.south.setNorth(newChunk)
			neighbors.south.combineMesh()
		}
		if (neighbors.east) {
			neighbors.east.setWest(newChunk)
			neighbors.east.combineMesh()
		}
		if (neighbors.west) {
			neighbors.west.setEast(newChunk)
			neighbors.west.combineMesh()
		}

		newChunk.combineMesh()
		this.chunks[newChunk.getChunkRepresentation()] = newChunk
	}

	_digestChunks = chunks => {
		Helpers.log('Loading Existing Chunks...')
		for (let chunk of chunks) {
			this.registerChunk(chunk)
			console.log('chunk loaded.')
		}
		Helpers.log('Finished Loading Existing Chunks.')
	}
	_digestBlocks = blocks => {
		// console.time('Blocks Digestion')
		const bs = blocks
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
		// console.timeEnd('Blocks Digestion')
		return bs
	}
	_handleMeshCombining = meshGroup => {
		this.mesh = Helpers.mergeMeshes(meshGroup)
		this.mesh.name = this.name
	}
}

export default World
