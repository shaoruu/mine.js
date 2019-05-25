import * as THREE from 'three'

import Config from '../../../Data/Config'
import Chunk from './Chunk/Chunk'
import Helpers from '../../../Utils/Helpers'
import worker from './World.worker'
import { UPDATE_BLOCK_MUTATION } from '../../../../../../lib/graphql'
import WorkerPool from '../Workers/WorkerPool'
import TaskQueue from '../Workers/TaskQueue'
import Chat from '../Chat/Chat'

const size = Config.chunk.size,
  height = Config.chunk.height,
  horzD = Config.player.horzD,
  vertD = Config.player.vertD,
  noiseConstant = Config.world.noiseConstant

class World {
  constructor(id, scene, worldData, apolloClient, resourceManager, container) {
    const { seed, name, changedBlocks } = worldData

    this.chunkDimension = Config.chunk.size * Config.block.dimension

    // Chat
    this.chat = new Chat(container)

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

  /**
   * Register changed blocks into this.changedBlocks for later quads generation
   * @param {Object[]} changedBlocks - Blocks saved in backend.
   */
  initWorld = changedBlocks => {
    if (changedBlocks)
      // TYPE = ID
      changedBlocks.forEach(({ type, x, y, z }) => {
        this.registerChangedBlock(type, x, y, z)
      })
  }

  /**
   * Initialize worker callback to handle worker's finished data
   */
  setupWorkerConfigs = () => {
    this.workerCallback = ({ data }) => {
      switch (data.cmd) {
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
            chunkName
          } = data

          const temp = this.chunks[chunkName]
          this.workerTaskHandler.addTasks(
            [[temp.meshQuads, quads], [temp.combineMesh]],
            {
              prioritized: true
            }
          )
          this.workerTaskHandler.addTask(
            () => {
              // Remove old then add new to scene
              const obj = this.scene.getObjectByName(chunkName)
              if (obj) this.scene.remove(obj)
              const mesh = temp.getMesh()
              if (mesh instanceof THREE.Object3D) this.scene.add(mesh)
              temp.untagBusyBlock(x, y, z)

              // Reset everything
              this.targetBlock = null
              this.potentialBlock = null
            },
            { prioritized: true }
          )

          break
        }
        default:
          break
      }
    }
  }

  /**
   * Called every x milliseconds to check for fresh generated chunk meshes.
   * @param {Object} chunkCoordinates - contains coordx, coordy and coordz, representing
   *                                the chunk-coordinates of the player's location.
   */
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

  /**
   * Creates a Chunk instance and add chuck generation to worker's task stack.
   * @param {Object} chunkCoordinates - contains coordx, coordy and coordz representing the
   *                                    coordinates of the chunk to generate.
   */
  registerChunk = ({ coordx, coordy, coordz }) => {
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

  /**
   * Stacks the tasks of breaking a block and regenerating the chunk
   * mesh onto the task queue and hands the player the broken block.
   */
  breakBlock = () => {
    if (!this.targetBlock) return // do nothing if no blocks are selected

    const todo = obtainedType => {
      if (obtainedType === 0) return
      this.player.obtain(obtainedType, 1)
    }

    this.updateBlock(0, this.targetBlock, todo)
  }

  /**
   * Stacks the tasks of placing a block and regenerating the chunk
   * mesh onto the task queue and takes a block from the players hand.
   */
  placeBlock = type => {
    if (!this.potentialBlock) return

    const todo = () => {
      this.player.takeFromHand(1)
    }

    this.updateBlock(type, this.potentialBlock, todo)
  }

  /**
   * General function controlling the worker task distribution
   * of placing/breaking blocks.
   *
   * @param {Int} type - Type of the prompted block.
   * @param {Object} blockData - Information about the prompted block
   *                    such as chunk coordinates and block position.
   * @param {Function} todo - Callback to be called after notifying the
   *                    workers about the changes to regenerate.
   */
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

  /**
   * Handles new subscription data from block subscription
   * for the entire world. Closely related to backend processes.
   *
   * @param {Object} blockInfo - Object containing attribute of "block"
   *                             straight from the GraphQL subscription.
   */
  updateChanged = ({ block }) => {
    if (!block) return
    const { node } = block

    const { coordx, coordy, coordz } = Helpers.toChunkCoords(node),
      chunkBlock = Helpers.toBlockCoords(node),
      { type, x: mx, y: my, z: mz } = node

    const targetChunk = this.getChunkByCoords(coordx, coordy, coordz)
    targetChunk.setBlock(chunkBlock.x, chunkBlock.y, chunkBlock.z, type)

    this.registerChangedBlock(type, mx, my, mz)

    // Checking for neighboring blocks FIRST.
    ;[['x', 'coordx'], ['y', 'coordy'], ['z', 'coordz']].forEach(([a, c]) => {
      const nc = { coordx, coordy, coordz },
        nb = { ...chunkBlock }
      let neighborAffected = false

      // If block is either on 0 or size, that means it has effects on neighboring chunks too.
      if (nb[a] === 0) {
        nc[c] -= 1
        nb[a] = size
        neighborAffected = true
      } else if (nb[a] === size - 1) {
        nc[c] += 1
        nb[a] = -1
        neighborAffected = true
      }
      if (neighborAffected) {
        const neighborChunk = this.getChunkByCoords(
          nc.coordx,
          nc.coordy,
          nc.coordz
        )

        // Setting neighbor's block that represents self.
        neighborChunk.setBlock(nb.x, nb.y, nb.z, type)

        this.workerPool.queueJob(
          {
            cmd: 'UPDATE_BLOCK',
            data: neighborChunk.grid.data,
            block: nb,
            configs: {
              size,
              stride: neighborChunk.grid.stride,
              chunkName: neighborChunk.name
            }
          },
          true
        )
      }
    })

    this.workerPool.queueJob(
      {
        cmd: 'UPDATE_BLOCK',
        data: targetChunk.grid.data,
        block: chunkBlock,
        configs: {
          size,
          stride: targetChunk.grid.stride,
          chunkName: targetChunk.name
        }
      },
      true
    )
  }

  getChunkByCoords = (cx, cy, cz) =>
    this.chunks[Helpers.getCoordsRepresentation(cx, cy, cz)] || null
  registerChangedBlock = (type, x, y, z) =>
    (this.changedBlocks[Helpers.getCoordsRepresentation(x, y, z)] = type)
  setPotential = potential => (this.potentialBlock = potential)
  setTarget = target => (this.targetBlock = target)
  setPlayer = player => (this.player = player)
  appendWorkerTask = (task, argument = null) =>
    this.workerTaskHandler.addTask(task, argument)
  getVoxelByWorldCoords = (x, y, z) => {
    const gbc = Helpers.toGlobalBlock({ x, y, z })
    return this.getVoxelByVoxelCoords(gbc.x, gbc.y, gbc.z)
  }
  getVoxelByVoxelCoords = (x, y, z) => {
    const { coordx, coordy, coordz } = Helpers.toChunkCoords({ x, y, z }),
      { x: bx, y: by, z: bz } = Helpers.toBlockCoords({ x, y, z })
    const chunk = this.chunks[
      Helpers.getCoordsRepresentation(coordx, coordy, coordz)
    ]
    if (!chunk) return 0

    return chunk.getBlock(bx, by, bz)
  }
}

export default World
