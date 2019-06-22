import * as THREE from 'three'

import Config from '../../Data/Config'
import Chunk from './Chunk/Chunk'
import Helpers from '../../Utils/Helpers'
import Workerfiles from './Workerfiles'
import { TaskQueue, WorkerPool } from '../WorkerUtils'
import { UPDATE_BLOCK_MUTATION } from '../../../../../lib/graphql'
import Chat from '../Chat/Chat'

const SIZE = Config.chunk.size,
  HORZ_D = Config.player.horzD,
  VERT_D = Config.player.vertD,
  P_I_2_TOE = Config.player.aabb.eye2toe,
  P_I_2_TOP = Config.player.aabb.eye2top,
  DIMENSION = Config.block.dimension,
  WORLD_GENERATION_CONFIG = Config.world.worldConfigs

class World {
  constructor(
    id,
    scene,
    worldData,
    apolloClient,
    resourceManager,
    container,
    playerId,
    isBrandNew
  ) {
    const { seed, name, changedBlocks } = worldData

    // FOR PREPARATION
    this.isReady = false

    // Chat
    this.chat = new Chat(playerId, id, container, apolloClient)

    this.id = id
    this.seed = seed
    this.name = name

    // Connections to outer space
    this.scene = scene

    // World Generating Helpers
    this.chunks = {}
    this.changedBlocks = {}
    this.initCB(changedBlocks)

    // Workers
    this.setupWorkerConfigs()
    this.workerPool = new WorkerPool(Workerfiles, this, {
      seed,
      size: SIZE,
      stride: [(SIZE + 2) ** 2, SIZE + 2, 1],
      generation: WORLD_GENERATION_CONFIG,
      changedBlocks: this.changedBlocks
    })
    this.workerTaskHandler = new TaskQueue() // This is handle/schedule all the tasks from worker callback

    // World Spawn
    this.initSpawn(isBrandNew)

    // Texture
    this.resourceManager = resourceManager

    // World Change Helpers
    this.targetBlock = null
    this.potentialBlock = null

    // Server Communication
    this.apolloClient = apolloClient
  }

  /**
   * Register changed blocks into this.changedBlocks for later quads generation
   * @param {Object[]} changedBlocks - Blocks saved in backend.
   */
  initCB = changedBlocks => {
    if (changedBlocks)
      // TYPE = ID
      changedBlocks.forEach(({ type, x, y, z }) => {
        this.registerChangedBlock(type, x, y, z)
      })
  }

  initSpawn = isBrandNew => {
    if (isBrandNew) {
      this.workerPool.queueJob({
        cmd: 'GET_HIGHEST',
        x: 0,
        z: 0
      })
    }
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
        case 'GET_HIGHEST': {
          const { h } = data
          const position = this.player.position

          this.player.setPosition(
            position.x + DIMENSION / 2,
            (h + P_I_2_TOE + P_I_2_TOP + 1) * DIMENSION,
            position.z + DIMENSION / 2
          )
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

    let allGood = true

    for (let x = coordx - HORZ_D; x <= coordx + HORZ_D; x++)
      for (let z = coordz - HORZ_D; z <= coordz + HORZ_D; z++)
        for (let y = coordy - VERT_D; y <= coordy + VERT_D; y++) {
          let tempChunk = this.chunks[Helpers.getCoordsRepresentation(x, y, z)]
          if (!tempChunk) {
            this.registerChunk({
              coordx: x,
              coordy: y,
              coordz: z
            })
            allGood = false
            continue
          }
          if (tempChunk.loading) {
            allGood = false
            continue // Chunk workers are working on it
          }

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

    if (!this.isReady && allGood) this.isReady = true
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
      changedBlocks: this.changedBlocks,
      chunkName: newChunk.name,
      coords: { coordx, coordy, coordz }
    })

    return newChunk
  }

  /**
   * Stacks the tasks of breaking a block and regenerating the chunk
   * mesh onto the task queue and hands the player the broken block.
   */
  breakBlock = (shouldGetBlock = true) => {
    if (!this.targetBlock) return // do nothing if no blocks are selected

    const todo = obtainedType => {
      if (obtainedType === 0 || !shouldGetBlock) return
      this.player.obtain(obtainedType, 1)
    }

    this.updateBlock(0, this.targetBlock, todo)
  }

  /**
   * Stacks the tasks of placing a block and regenerating the chunk
   * mesh onto the task queue and takes a block from the players hand.
   */
  placeBlock = (type, shouldTakeBlock = true) => {
    if (!this.potentialBlock) return

    const todo = () => {
      if (shouldTakeBlock) this.player.takeFromHand(1)
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
      x: cx * SIZE + block.x,
      y: cy * SIZE + block.y,
      z: cz * SIZE + block.z
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
        nb[a] = SIZE
        neighborAffected = true
      } else if (nb[a] === SIZE - 1) {
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
            chunkName: neighborChunk.name
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
        chunkName: targetChunk.name
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
  getTargetBlockInfo = () => {
    if (!this.targetBlock) return null

    const { chunk, block } = this.targetBlock

    const { x, y, z } = block,
      { cx, cy, cz } = chunk

    const parentChunk = this.getChunkByCoords(cx, cy, cz)

    return {
      block,
      chunk,
      type: parentChunk.getBlock(x, y, z)
    }
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
