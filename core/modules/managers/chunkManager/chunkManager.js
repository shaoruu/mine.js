import Helpers from '../../../utils/helpers'
import Config from '../../../config/config'

import Mesher from './mesher'
import Chunk from './chunk'
import ChunkGenWorker from './chunkGen.worker'

import * as THREE from 'three'

const MAX_WORKER_COUNT = Config.tech.maxWorkerCount

class ChunkManager {
  constructor(scene, world, resourceManager, workerManager, changedBlocks) {
    this.scene = scene
    this.world = world

    this.resourceManager = resourceManager
    this.workerManager = workerManager

    this.dirtyChunks = []
    this.chunks = {}

    this.isReady = false

    this.meshGroup = new THREE.Group()
    this.scene.add(this.meshGroup)

    this.prepare(changedBlocks)
  }

  prepare = changedBlocks => {
    /**
     * changedBlock sample:
     * [
     *  {
     *    type: 1,
     *    x: 0,
     *    y: 12,
     *    z: 14
     *  },
     *  {
     *    type: 2,
     *    x: 1,
     *    y: 12,
     *    z: 14
     *  }
     * ]
     */
    this.cbDict = {}

    changedBlocks.forEach(cb => this.markCB(cb))

    /** WORKER */
    this.workerManager.initChunkPool(ChunkGenWorker, this, {
      seed: this.world.data.seed,
      type: this.world.data.type,
      changedBlocks
    })
  }

  update = () => {
    if (this.dirtyChunks.length === 0) return

    // do the updates one by one
    this.setupChunk(...this.dirtyChunks.shift())
  }

  surroundingChunksCheck = (coordx, coordy, coordz) => {
    const updatedChunks = {}

    let count = 0
    let allGood = true

    const RENDER_D = this.world.data.user.settings.renderDistance

    for (let x = coordx - RENDER_D; x <= coordx + RENDER_D; x++) {
      for (let z = coordz - RENDER_D; z <= coordz + RENDER_D; z++) {
        for (let y = coordy - RENDER_D + 1; y <= coordy + RENDER_D - 1; y++) {
          updatedChunks[this.getChunkRep(x, y, z)] = true

          const tempChunk = this.getChunkFromCoords(x, y, z)

          if (!tempChunk) {
            if (count < (navigator.hardwareConcurrency || MAX_WORKER_COUNT)) {
              this.makeChunk(x, y, z)
              count++
            } else allGood = false
            continue
          }
          if (tempChunk.getLoading()) {
            allGood = false
            continue
          }

          if (!tempChunk.getIsInScene()) {
            // IF NOT YET ADDED TO SCENE
            if (tempChunk.getMesh() instanceof THREE.Object3D) {
              tempChunk.addSelf(this.meshGroup)
              tempChunk.setIsInScene(true)
            }
          }
        }
      }
    }

    const shouldBeRemoved = []
    this.meshGroup.children.forEach(child => {
      if (!updatedChunks[child.name] && child.isChunk) {
        shouldBeRemoved.push(child)
        this.chunks[child.name] = undefined
      }
    })
    shouldBeRemoved.forEach(obj => this.meshGroup.remove(obj))

    if (!this.isReady && allGood) this.isReady = true
  }

  markCB = ({ type, x, y, z }) => {
    if (type === 0) return

    this.cbDict[this.getChunkRep(x, y, z)] = type
  }

  makeChunk = (x, y, z) => {
    const newChunk = new Chunk(x, y, z)
    this.chunks[this.getChunkRep(x, y, z)] = newChunk

    this.tagDirtyChunk(x, y, z)
  }

  setupChunk = (cx, cy, cz) => {
    this.workerManager.queueGeneralChunk({
      cmd: 'GET_CHUNK',
      chunkRep: this.getChunkRep(cx, cy, cz),
      coords: { coordx: cx, coordy: cy, coordz: cz }
    })
  }

  meshChunk = (chunk, meshData) => {
    chunk.setLoading(false)

    if (!meshData) return

    const [geoJSON, materials] = meshData

    const mesh = Mesher.processMeshData(
      geoJSON,
      materials,
      this.resourceManager
    )

    if (!mesh) return

    chunk.setMesh(mesh)
  }

  tagDirtyChunk = (x, y, z) => this.dirtyChunks.push([x, y, z])

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getChunkRep = (x, y, z) => Helpers.get3DCoordsRep(x, y, z)

  getChunkFromCoords = (cx, cy, cz) => this.chunks[this.getChunkRep(cx, cy, cz)]

  getChunkFromRep = rep => this.chunks[rep]

  getTypeAt = (x, y, z) => {
    const { coordx, coordy, coordz } = Helpers.globalBlockToChunkCoords({
      x,
      y,
      z
    })
    const { x: bx, y: by, z: bz } = Helpers.globalBlockToChunkBlock({ x, y, z })
    const chunk = this.getChunkFromCoords(coordx, coordy, coordz)

    if (!chunk || !chunk.getData()) return undefined

    return chunk.getBlock(bx, by, bz)
  }
}

export default ChunkManager
