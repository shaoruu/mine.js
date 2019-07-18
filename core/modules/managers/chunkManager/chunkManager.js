import Helpers from '../../../utils/helpers'
import Config from '../../../config/config'

import Mesher from './mesher'
import Chunk from './chunk'
import { classicGeneratorCode } from './generation/terrain'

import * as THREE from 'three'

const SIZE = Config.chunk.size
const MAX_CHUNK_PER_FRAME = Config.chunk.maxPerFrame
const DIMENSION = Config.block.dimension
const HORZ_D = Config.player.render.horzD
const VERT_D = Config.player.render.vertD
const TRANSARENT_BLOCKS = Config.block.transparent

class ChunkManager {
  constructor(scene, seed, resourceManager, workerManager, changedBlocks) {
    this.scene = scene
    this.seed = seed

    this.resourceManager = resourceManager
    this.workerManager = workerManager

    this.dirtyChunks = []
    this.chunks = {}

    this.isReady = false

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
    this.workerManager.initChunkPool(classicGeneratorCode, this, {
      seed: this.seed,
      size: SIZE,
      dimension: DIMENSION,
      stride: [(SIZE + 2) ** 2, SIZE + 2, 1],
      changedBlocks: this.cbDict,
      transparent: TRANSARENT_BLOCKS
      // generation: WORLD_GENERATION_CONFIG,
    })

    // this.workerManager.queueGeneralChunk({
    //   cmd: 'GET_HIGHEST',
    //   x: 0,
    //   z: 0
    // })
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

    for (let x = coordx - HORZ_D; x <= coordx + HORZ_D; x++) {
      for (let z = coordz - HORZ_D; z <= coordz + HORZ_D; z++) {
        for (let y = coordy - VERT_D; y <= coordy + VERT_D; y++) {
          updatedChunks[this.getChunkRep(x, y, z)] = true

          const tempChunk = this.getChunkFromCoords(x, y, z)

          if (!tempChunk) {
            if (count < MAX_CHUNK_PER_FRAME) {
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
              tempChunk.addSelf(this.scene)
              tempChunk.setIsInScene(true)
            }
          }
        }
      }
    }

    const shouldBeRemoved = []
    this.scene.children.forEach(child => {
      if (!updatedChunks[child.name] && child.isChunk) {
        shouldBeRemoved.push(child)
        this.chunks[child.name].setIsInScene(false)
      }
    })
    shouldBeRemoved.forEach(obj => this.scene.remove(obj))

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

  meshChunk = (chunk, planes) => {
    chunk.setLoading(false)
    if (planes.length === 0) return

    // TODO: MAKE IT PER FRAME
    // console.time(`${chunk.getRep()} mesh:`)
    const mesh = Mesher.mergeMeshes(planes, this.resourceManager)
    // console.timeEnd(`${chunk.getRep()} mesh:`)

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
    const { coordx, coordy, coordz } = Helpers.globalBlockToChunkCoords({ x, y, z })
    const { x: bx, y: by, z: bz } = Helpers.globalBlockToChunkBlock({ x, y, z })
    const chunk = this.getChunkFromCoords(coordx, coordy, coordz)

    if (!chunk) return undefined

    return chunk.getBlock(bx, by, bz)
  }
}

export default ChunkManager
