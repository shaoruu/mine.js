import ndarray from 'ndarray'

import Config from '../../../../Data/Config'
import Helpers from '../../../../Utils/Helpers'

const size = Config.chunk.size

class Chunk {
  constructor(resourceManager, { origin }) {
    // Inheritted Managers
    this.resourceManager = resourceManager

    // Member Initialization
    this.origin = origin
    this.mesh = null
    this.name = this.getChunkRepresentation()
    this.loading = true

    // Grid System of Chunk
    const arr = new Uint16Array((size + 2) * (size + 2) * (size + 2))
    this.grid = new ndarray(arr, [size + 2, size + 2, size + 2])

    this.isLoaded = false

    this.blocksInProgress = {}
  }

  /**
   * Register block data onto grid
   * @param {array} blocks - Array of blocks to initialze chunk.
   */
  initGrid = blocks => {
    for (let block of blocks) {
      const {
        id,
        position: { x, y, z }
      } = block

      this.grid.set(x, z, y, id)
    }
  }

  /** Generate THREE meshes and store them into an array. */
  meshQuads = quads => {
    // Avoiding extra work.
    if (quads === undefined || quads.length === 0) this.mesh = null

    /**
     * Internal functions for convenience
     */

    const meshes = []

    for (let quad of quads) {
      const [coords, geo, type, material] = quad

      const globalCoords = Helpers.mapVecToWorldCoords(this.origin, coords)

      const mat = this.resourceManager.getBlockMat(type)[material]

      meshes.push({ geo, pos: globalCoords, mat })
    }

    this.meshes = meshes
  }

  /** Calculate mesh and merge them together */
  combineMesh = () => {
    // console.time('Block Combination')
    if (!this.meshes || this.meshes.length === 0) {
      this.mesh = null
      return
    }

    this.mesh = Helpers.mergeMeshes(this.meshes, this.resourceManager)
    this.mesh.name = this.name
    this.mesh.isChunk = true
    // console.timeEnd('Block Combination')
  }

  setGrid = blocks => (this.grid.data = blocks)

  setBlock = (x, y, z, val) => this.grid.set(x + 1, z + 1, y + 1, val)

  getBlock = (x, y, z) => this.grid.get(x + 1, z + 1, y + 1) // avoid passing in neighbors
  getMesh = () => this.mesh
  mark = () => (this.isLoaded = true)
  unmark = () => (this.isLoaded = false)
  markAsFinishedLoading = () => (this.loading = false)

  checkBusyBlock = (x, y, z) =>
    this.blocksInProgress[Helpers.getCoordsRepresentation(x, y, z)]
  tagBusyBlock = (x, y, z) =>
    (this.blocksInProgress[Helpers.getCoordsRepresentation(x, y, z)] = true)
  untagBusyBlock = (x, y, z) =>
    delete this.blocksInProgress[Helpers.getCoordsRepresentation(x, y, z)]

  getChunkRepresentation = () =>
    Helpers.getCoordsRepresentation(this.origin.x, this.origin.y, this.origin.z)
}

export default Chunk
