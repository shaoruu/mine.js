import * as THREE from 'three'

import Config from '../../../Data/Config'
import Chunk from './Chunk/Chunk'
import Helpers from '../../../Utils/Helpers'
import worker from './World.worker'
import { UPDATE_BLOCK_MUTATION } from '../../../../../../lib/graphql'
import WorkerPool from '../Workers/WorkerPool'
import TaskQueue from '../Workers/TaskQueue'

const size = Config.chunk.size,
  height = Config.chunk.height,
  horzD = Config.player.horzD,
  vertD = Config.player.vertD,
  noiseConstant = Config.world.noiseConstant

class World {
  constructor(id, scene, worldData, apolloClient, resourceManager) {
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
    this.setupWorkerConfigs()
    this.workerPool = new WorkerPool(worker, this)
    this.workerTaskHandler = new TaskQueue() // This is handle/schedule all the tasks from worker callback

    // Texture
    this.resourceManager = resourceManager

    // World Change Helpers
    this.targetBlock = null
    this.potentialBlock = null

    // Server Communicatin
    this.apolloClient = apolloClient

    this.initWorld(changedBlocks)
  }

  setupWorkerConfigs = () => {
    // Initializing worker callback for later usage
    this.workerCallback = ({ data }) => {
      // console.time('workerCallback')
      const { cmd } = data
      switch (cmd) {
        case 'GET_CHUNK': {
          const { quads, blocks, chunkName } = data
          const temp = this.chunks[chunkName]

          this.workerTaskHandler.addTasks([
            [temp.setGrid, blocks],
            [temp.meshQuads, quads],
            [temp.combineMesh],
            [temp.markAsFinishedLoading]
          ])
          break
        }
        case 'UPDATE_BLOCK': {
          const {
            quads,
            block: { x, y, z },
            type,
            chunkName
          } = data

          const temp = this.chunks[chunkName]
          this.workerTaskHandler.addTasks([
            [temp.meshQuads, quads],
            [temp.combineMesh]
          ])
          this.workerTaskHandler.addTask(() => {
            // Remove old then add new to scene
            const obj = this.scene.getObjectByName(chunkName)
            if (obj) this.scene.remove(obj)
            const mesh = temp.getMesh()
            if (mesh instanceof THREE.Object3D) this.scene.add(mesh)

            // Change chunk data
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
      // console.timeEnd('workerCallback')
    }
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
          if (tempChunk.loading) continue // Chunk workers are working on it

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

  registerChunk = async ({ coordx, coordy, coordz }) => {
    const newChunk = new Chunk(this.resourceManager, {
      origin: {
        x: coordx,
        y: coordy,
        z: coordz
      }
    })
    this.chunks[newChunk.name] = newChunk

    this.workerPool.queueJob({
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

    // Checking for neighboring blocks FIRST.
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

        this.workerPool.queueJob({
          cmd: 'UPDATE_BLOCK',
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

    this.workerPool.queueJob({
      cmd: 'UPDATE_BLOCK',
      data: targetChunk.grid.data,
      block: chunkBlock,
      type,
      configs: {
        size,
        stride: targetChunk.grid.stride,
        chunkName: targetChunk.name
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
  appendWorkerTask = (task, argument = null) =>
    this.workerTaskHandler.addTask(task, argument)
  getBlockInfoByTHREECoords = ({ x, y, z }) => {
    const gbc = Helpers.toGlobalBlock({ x, y, z }, true)
    const { coordx, coordy, coordz } = Helpers.toChunkCoords(gbc),
      { x: bx, y: by, z: bz } = Helpers.toBlockCoords(gbc)
    const chunk = this.chunks[
      Helpers.getCoordsRepresentation(coordx, coordy, coordz)
    ]
    const id = chunk.getBlock(bx, by, bz)
    const info = Config.dictionary.block[id]
    if (!info) return null
    return info
  }
}

export default World
