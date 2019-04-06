import * as THREE from 'three'
// import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'

import Config from '../../../Data/Config'
import Chunk from './Chunk/Chunk'
import Helpers from '../../../Utils/Helpers'
import BlockMaterials from './Chunk/Block/BlockMaterials'
import Generator from './Generator/Generator'

const size = Config.chunk.size,
	horzD = Config.player.horzD,
	vertD = Config.player.vertD

class World {
	constructor(scene, worldData) {
		const { seed, name, changedBlocks } = worldData

		this.chunkDimension = Config.chunk.size * Config.block.dimension

		this.seed = seed
		this.name = name

		// Connections to outer space
		this.scene = scene

		// World Generating Helpers
		this.chunks = {}
		this.changedBlocks = {}
		this.generator = new Generator(this.seed)

		this.isDirty = false

		// Loaders
		this.materialManager = new BlockMaterials()
		this.loadTextures()

		this.initWorld(changedBlocks)
	}

	loadTextures = () => {
		Helpers.log('Loading Textures...')
		for (let key in Config.textures.blocks)
			this.materialManager.load(key, Config.textures.blocks[key])
		Helpers.log('Finished Loading Textures.')
	}

	initWorld = changedBlocks => {
		console.log(changedBlocks)
		if (changedBlocks)
			// TYPE = ID
			changedBlocks.forEach(({ type, x, y, z }) => {
				this.changedBlocks[Helpers.getChunkRepresentation(x, y, z)] = type
			})
	}

	requestMeshUpdate = ({ coordx, coordy, coordz }) => {
		const updatedChunks = {}

		for (let x = coordx - horzD; x <= coordx + horzD; x++)
			for (let z = coordz - horzD; z <= coordz + horzD; z++)
				for (let y = coordy - vertD; y <= coordy + vertD; y++) {
					let tempChunk = this.chunks[Helpers.getChunkRepresentation(x, y, z)]
					if (!tempChunk)
						tempChunk = this.registerChunk({
							coordx: x,
							coordy: y,
							coordz: z
						})

					updatedChunks[tempChunk.name] = true
					if (!tempChunk.isLoaded) {
						const mesh = tempChunk.getMesh()
						if (mesh instanceof THREE.Object3D) this.scene.add(mesh)
						tempChunk.mark()
					}
				}

		const shouldBeRemoved = []
		this.scene.children.forEach(child => {
			if (!updatedChunks[child.name] && child.isChunk) {
				shouldBeRemoved.push(child)
				this.chunks[child.name].unmark()
			}
		})
		shouldBeRemoved.forEach(obj => this.scene.remove(obj))
	}

	registerChunk = ({ coordx, coordy, coordz }) => {
		const newChunk = new Chunk(this.materialManager, {
			origin: {
				x: coordx,
				y: coordy,
				z: coordz
			},
			blocks: this.generateBlocks(coordx, coordy, coordz)
		})

		newChunk.combineMesh()
		this.chunks[newChunk.name] = newChunk

		return newChunk
	}

	generateBlocks = (coordx, coordy, coordz) => {
		const blocks = []

		// ! THIS IS WHERE CHUNK GENERATING HAPPENS FOR SINGLE CHUNK!
		for (let x = 0; x < size; x++)
			for (let z = 0; z < size; z++)
				for (let y = 0; y < size; y++) {
					blocks.push({
						position: {
							x,
							y,
							z
						},
						id:
							this.changedBlocks[Helpers.getChunkRepresentation(x, y, z)] ||
							this.generator.getBlockInfo(
								coordx * size + x,
								coordy * size + y,
								coordz * size + z
							)
					})
				}

		return blocks
	}

	updateChanged = ({ type, x, y, z }) => {
		// TODO Update dictionary `changedBlocks` and mark chunks for new update
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
		return blocks
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
	}
	_handleMeshCombining = meshGroup => {
		this.mesh = Helpers.mergeMeshes(meshGroup)
		this.mesh.name = this.name
	}
}

export default World
