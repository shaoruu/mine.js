import Helpers from '../../../utils/helpers'
import Config from '../../../config/config'

import ClassicGenerator from './generation/terrain/classicGenerator'
import Mesher from './mesher'
import Chunk from './chunk'

import * as THREE from 'three'
import ndarray from 'ndarray'

const SIZE = Config.chunk.size
const HORZ_D = Config.player.render.horzD
const VERT_D = Config.player.render.vertD

class ChunkManager {
  constructor(scene, seed, resourceManager, workerManager, changedBlocks) {
    this.scene = scene
    this.generator = new ClassicGenerator(seed)

    this.resourceManager = resourceManager
    this.workerManager = workerManager

    this.dirtyChunks = []
    this.chunks = {}

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
    this.generator.registerCB(this.cbDict)
  }

  update = () => {
    if (this.dirtyChunks.length === 0) return

    // do the updates one by one
    const jobTag = this.dirtyChunks.shift()

    const { x, y, z } = Helpers.get3DCoordsFromRep(jobTag)

    this.generateChunk(x, y, z)
  }

  surroundingChunksCheck = (coordx, coordy, coordz) => {
    const updatedChunks = {}

    for (let x = coordx - HORZ_D; x <= coordx + HORZ_D; x++) {
      for (let y = coordy - VERT_D; y <= coordy + VERT_D; y++) {
        for (let z = coordz - HORZ_D; z <= coordz + HORZ_D; z++) {
          const tempChunk = this.getChunkFromCoords(x, y, z)

          if (!tempChunk) {
            this.makeChunk(x, y, z)
            continue
          } else if (tempChunk.getLoading()) continue

          // GETTING HERE MEANS CHUNK IS READY TO BE ADDED
          updatedChunks[tempChunk.getRep()] = true

          if (!tempChunk.getIsInScene()) {
            // IF NOT YET ADDED TO SCENE
            const mesh = tempChunk.getMesh()
            if (mesh instanceof THREE.Object3D) this.scene.add(mesh)

            tempChunk.setIsInScene(true)
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

  generateChunk = (cx, cy, cz) => {
    const tempChunk = this.getChunkFromCoords(cx, cy, cz)
    const chunkDim = SIZE + 2
    const dims = [chunkDim, chunkDim, chunkDim]
    const data = ndarray(new Int8Array(chunkDim ** 3), dims)

    this.generator.setVoxelData(data, cx, cy, cz)
    tempChunk.setData(data)

    if (!data.data.filter(e => e !== 0).length) return

    // MESH CHUNK
    const mesh = Mesher.meshChunk(this.resourceManager, data, dims, cx, cy, cz)

    tempChunk.setMesh(mesh)
    tempChunk.setLoading(false)
  }

  meshChunkFromRep = rep => {
    const { x, y, z } = Helpers.get3DCoordsFromRep(rep)

    // TODO
    this.meshChunk(x, y, z)
  }

  meshChunk = (x, y, z) => {
    // TODO
    Helpers.log(`${x}:${y}:${z}`, true)
  }

  tagDirtyChunk = (x, y, z) => this.dirtyChunks.push(this.getChunkRep(x, y, z))

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getChunkRep = (x, y, z) => Helpers.get3DCoordsRep(x, y, z)

  getChunkFromCoords = (cx, cy, cz) => this.chunks[this.getChunkRep(cx, cy, cz)]

  getTypeAt = () => {
    return 0
  }
}

export default ChunkManager
