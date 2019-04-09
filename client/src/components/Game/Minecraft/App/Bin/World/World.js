import * as THREE from 'three'

import Config from '../../../Data/Config'
import Chunk from './Chunk/Chunk'
import Helpers from '../../../Utils/Helpers'
import worker from './World.worker'
import WebWorker from '../../Bin/WebWorker/WebWorker'
import BlockMaterials from './Chunk/Block/BlockMaterials'

const size = Config.chunk.size,
	height = Config.chunk.height,
	horzD = Config.player.horzD,
	vertD = Config.player.vertD,
	noiseConstant = Config.world.noiseConstant

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

		// Loaders
		this.materialManager = new BlockMaterials()
		this.loadTextures()

		// Workers
		this.worker = new WebWorker(worker)
		this.setupWorker()

		this.initWorld(changedBlocks)
	}

	setupWorker = () => {
		this.worker.addEventListener('message', ({ data }) => {
			const { ACTION } = data
			switch (ACTION) {
				case 'GEN_BLOCKS': {
					const {
						blocks,
						coords: { coordx, coordy, coordz }
					} = data
					const temp = this.chunks[
						Helpers.getCoordsRepresentation(coordx, coordy, coordz)
					]
					temp.initGrid(blocks)
					this.worker.postMessage({
						ACTION: 'GEN_QUADS',
						size,
						volume: temp.grid.data,
						chunkName: temp.name
					})
					break
				}
				case 'GEN_QUADS': {
					const { quads, chunkName } = data
					const temp = this.chunks[chunkName]
					temp.combineMesh(temp.meshQuads(quads))
					temp.loading = false
					break
				}
				default:
					break
			}
		})
	}

	loadTextures = () => {
		Helpers.log('Loading Textures...')
		for (let key in Config.textures.blocks)
			this.materialManager.load(key, Config.textures.blocks[key])
		Helpers.log('Finished Loading Textures.')
	}

	initWorld = changedBlocks => {
		if (changedBlocks)
			// TYPE = ID
			changedBlocks.forEach(({ type, x, y, z }) => {
				this.changedBlocks[Helpers.getCoordsRepresentation(x, y, z)] = type
			})
	}

	requestMeshUpdate = ({ coordx, coordy, coordz }) => {
		const updatedChunks = {}

		for (let x = coordx - horzD; x <= coordx + horzD; x++)
			for (let z = coordz - horzD; z <= coordz + horzD; z++)
				for (let y = coordy - vertD; y <= coordy + vertD; y++) {
					let tempChunk = this.chunks[Helpers.getCoordsRepresentation(x, y, z)]
					if (!tempChunk) {
						this.registerChunk({
							coordx: x,
							coordy: y,
							coordz: z
						})
						continue
					}
					if (tempChunk.loading) continue // Chunk worker is working on it

					// To reach here means the chunk is loaded and meshed.
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
			}
		})
		this.chunks[newChunk.name] = newChunk

		this.worker.postMessage({
			ACTION: 'GEN_BLOCKS',
			seed: this.seed,
			changedBlocks: this.changedBlocks,
			configs: {
				noiseConstant,
				size,
				height
			},
			coords: { coordx, coordy, coordz }
		})

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
							this.changedBlocks[
								Helpers.getCoordsRepresentation(
									coordx * size + x,
									coordy * size + y,
									coordz * size + z
								)
							] ||
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
