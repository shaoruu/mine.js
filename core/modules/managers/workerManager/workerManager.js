import Config from '../../../config/config'

import WorkerPool from './workerPool'
import TaskQueue from './taskQueue'

// import * as THREE from 'three'

const DIMENSION = Config.block.dimension
const P_I_2_TOE = Config.player.aabb.eye2toe
// const P_I_2_TOP = Config.player.aabb.eye2top

class WorkerManager {
  constructor(world) {
    this.world = world
  }

  initChunkPool = (instance, chunkManager, config) => {
    this.chunkManager = chunkManager

    this.chunkWorkerPool = new WorkerPool(instance, this.chunkCallback, config)
    this.chunkTaskQueue = new TaskQueue()
    this.chunkJobs = []
  }

  queueSpecificChunk = job => this.chunkWorkerPool.queueSJob(job)

  queueGeneralChunk = job => this.chunkWorkerPool.queueGJob(job)

  broadcastChunk = job => this.chunkWorkerPool.broadcast(job)

  chunkCallback = ({ data }) => {
    switch (data.cmd) {
      case 'GET_CHUNK': {
        const { planes, blocks, chunkRep } = data
        const temp = this.chunkManager.getChunkFromRep(chunkRep)

        if (!planes.filter(e => e === 0)) break

        this.chunkTaskQueue.addTasks([
          [temp.setData, blocks],
          [this.chunkManager.meshChunk, [temp, planes]]
        ])

        break
      }
      case 'GET_HIGHEST': {
        const { h } = data
        const position = this.world.player.getPosition()

        this.world.player.setPosition(
          position.x + DIMENSION / 2,
          (h + P_I_2_TOE + 1) * DIMENSION,
          position.z + DIMENSION / 2
        )

        this.world.setState({ isSetup: true })
        break
      }
      // case 'UPDATE_BLOCK': {
      //   const {
      //     combined,
      //     block: { x, y, z },
      //     chunkName
      //   } = data

      //   const temp = this.chunks[chunkName]
      //   window.requestAnimationFrame(() => {
      //     this.chunkTaskQueue.addTasks([[temp.generateMesh, combined]], {
      //       prioritized: true
      //     })
      //   })
      //   window.requestAnimationFrame(() => {
      //     this.chunkTaskQueue.addTask(
      //       () => {
      //         // Remove old then add new to scene
      //         const obj = this.scene.getObjectByName(chunkName)
      //         if (obj) this.scene.remove(obj)
      //         const mesh = temp.getMesh()
      //         if (mesh instanceof THREE.Object3D) this.scene.add(mesh)
      //         temp.untagBusyBlock(x, y, z)

      //         // Reset everything
      //         this.targetBlock = null
      //         this.potentialBlock = null
      //       },
      //       { prioritized: true }
      //     )
      //   })

      //   break
      // }
      default:
        break
    }
  }

  update = () => {
    this.chunkWorkerPool.update()
    this.chunkTaskQueue.update()
  }
}

export default WorkerManager
