import * as THREE from 'three'

import Config from '../../../Data/Config'
import Chunk from './Chunk/Chunk'
import Helpers from '../../../Utils/Helpers'
import worker from './World.worker'
import WebWorker from '../../Bin/WebWorker/WebWorker'
import { UPDATE_BLOCK_MUTATION } from '../../../../../../lib/graphql'

const size = Config.chunk.size,
	height = Config.chunk.height,
	horzD = Config.player.horzD,
	vertD = Config.player.vertD,
	noiseConstant = Config.world.noiseConstant

class World {
	constructor(id, scene, worldData, apolloClient, materialManager) {
		const { seed, name, changedBlocks } = worldData

		this.chunkDimension = Config.chunk.size * Config.block.dimension

		this.id = id
		this.seed = seed
		this.name = name

		// Connections to outer space
		this.scene = scene

		// World Generating Helpers
		this.chunks = {}
		this.changedBlocks = {}

		// Workers
		this.worker = new WebWorker(worker)
		this.setupWorker()

		// Texture
		this.materialManager = materialManager

		// World Change Helpers
		this.targetBlock = null
		this.potentialBlock = null

		// Server Communicatin
		this.apolloClient = apolloClient

		this.initWorld(changedBlocks)
	}

	setupWorker = () => {
		this.worker.addEventListener('message', ({ data }) => {
			const { cmd } = data
			switch (cmd) {
				case 'GET_CHUNK': {
					const { quads, blocks, chunkName } = data
					const temp = this.chunks[chunkName]
					temp.setGrid(blocks)
					temp.combineMesh(temp.meshQuads(quads)).then(
						() => (temp.loading = false)
					)
					break
				}
				case 'BREAK_BLOCK': {
					const {
						quads,
						block: { x, y, z },
						type,
						chunkName
					} = data
					const temp = this.chunks[chunkName]
					temp.combineMesh(temp.meshQuads(quads)).then(() => {
						// Remove old then add new to scene
						const obj = this.scene.getObjectByName(chunkName)
						if (obj) this.scene.remove(obj)
						const mesh = temp.getMesh()
						if (mesh instanceof THREE.Object3D) this.scene.add(mesh)

						// Alter grid adta
						temp.setBlock(x, y, z, type)
						temp.untagBusyBlock(x, y, z)

						// Reset everything
						this.targetBlock = null
						this.potentialBlock = null
					})
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
				this.registerChangedBlock(type, x, y, z)
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
			cmd: 'GET_CHUNK',
			seed: this.seed,
			changedBlocks: this.changedBlocks,
			configs: {
				noiseConstant,
				size,
				height,
				stride: newChunk.grid.stride,
				chunkName: newChunk.name
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

	breakBlock = () => {
		if (!this.targetBlock) return // do nothing if no blocks are selected

		const todo = obtainedType => {
			if (obtainedType === 0) return
			this.player.obtain(obtainedType, 1)
		}

		this.updateBlock(0, this.targetBlock, todo)
	}

	placeBlock = type => {
		if (!this.potentialBlock) return

		const todo = () => {
			this.player.takeFromHand(1)
		}

		this.updateBlock(type, this.potentialBlock, todo)
	}

	updateBlock = (type, blockData, todo) => {
		const {
			chunk: { cx, cy, cz },
			block
		} = blockData

		const mappedBlock = {
			x: cx * size + block.x,
			y: cy * size + block.y,
			z: cz * size + block.z
		}

		const parentChunk = this.getChunkByCoords(cx, cy, cz)

		const { x, y, z } = block
		if (parentChunk.checkBusyBlock(x, y, z)) return
		else parentChunk.tagBusyBlock(x, y, z)

		// Communicating with server
		this.apolloClient
			.mutate({
				mutation: UPDATE_BLOCK_MUTATION,
				variables: {
					worldId: this.id,
					type,
					...mappedBlock
				}
			})
			.then(() => {
				const obtainedType = parentChunk.getBlock(x, y, z)
				todo(obtainedType)
			})
			.catch(err => console.error(err))
	}

	updateChanged = ({ block }) => {
		if (!block) return
		const { node } = block

		const { coordx, coordy, coordz } = Helpers.toChunkCoords(node),
			chunkBlock = Helpers.toBlockCoords(node),
			{ type, x: mx, y: my, z: mz } = node

		const targetChunk = this.getChunkByCoords(coordx, coordy, coordz)

		this.registerChangedBlock(type, mx, my, mz)

		this.worker.postMessage({
			cmd: 'BREAK_BLOCK',
			data: targetChunk.grid.data,
			block: chunkBlock,
			type,
			configs: {
				size,
				stride: targetChunk.grid.stride,
				chunkName: targetChunk.name
			}
		})

		// Checking for neighboring blocks.
		const axes = [['x', 'coordx'], ['y', 'coordy'], ['z', 'coordz']]
		axes.forEach(([a, c]) => {
			const nc = { coordx, coordy, coordz },
				nb = { ...chunkBlock }
			let shouldWork = false

			if (chunkBlock[a] === 0) {
				nc[c] -= 1
				nb[a] = size
				shouldWork = true
			} else if (chunkBlock[a] === size - 1) {
				nc[c] += 1
				nb[a] = -1
				shouldWork = true
			}
			if (shouldWork) {
				const neighborChunk = this.getChunkByCoords(
					nc.coordx,
					nc.coordy,
					nc.coordz
				)
				this.worker.postMessage({
					cmd: 'BREAK_BLOCK',
					data: neighborChunk.grid.data,
					block: nb,
					type,
					configs: {
						size,
						stride: neighborChunk.grid.stride,
						chunkName: neighborChunk.name
					}
				})
			}
		})
	}

	getChunkByCoords = (cx, cy, cz) => {
		const temp = this.chunks[Helpers.getCoordsRepresentation(cx, cy, cz)]

		return temp || null
	}

	registerChangedBlock = (type, x, y, z) => {
		this.changedBlocks[Helpers.getCoordsRepresentation(x, y, z)] = type
	}
	setPotential = potential => (this.potentialBlock = potential)
	setTarget = target => (this.targetBlock = target)
	setPlayer = player => (this.player = player)

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
