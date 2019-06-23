import ndarray from 'ndarray'

import Config from '../../../Data/Config'
import Helpers from '../../../Utils/Helpers'

const size = Config.chunk.size

class Chunk {
  constructor(resourceManager, { origin }) {
    // Inherited Managers
    this.resourceManager = resourceManager

    // Member Initialization
    this.origin = origin
    this.mesh = null
    this.name = this.getChunkRepresentation()
    this.loading = true

    // Grid System of Chunk
    const arr = new Uint16Array((size + 2) * (size + 2) * (size + 2))
    this.grid = new ndarray(arr, [size + 2, size + 2, size + 2])

    const lightingArr = new Uint16Array((size) ** 3 * 6)
    this.lighting = new ndarray(lightingArr, [size, size, size, 6])

    const smoothLightingArr = new Uint16Array(size ** 3 * 6 * 3 * 3)
    this.smoothLighting = new ndarray(smoothLightingArr, [size, size, size, 6, 3, 3])

    this.isLoaded = false

    this.blocksInProgress = {}
  }
  /** Generate THREE meshes and store them into an array. */
  meshQuads = quads => {
    // Avoiding extra work.
    if (quads === undefined || quads.length === 0) this.mesh = null

    /**
     * Internal functions for convenience
     */

    const meshes = []

    for (let i = 0; i < quads.length; i++) {
      const [coords, geo, type, material, lighting, smoothLighting] = quads[i]

      const globalCoords = Helpers.mapVecToWorldCoords(this.origin, coords)

      const mat = this.resourceManager.getBlockMat(type, geo, material)

      meshes.push({ geo, pos: globalCoords, mat, lighting, smoothLighting })
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

  setLighting = lighting => this.lighting.data = lighting

  setSmoothLighting = smoothLighting => this.smoothLighting.data = smoothLighting

  setBlock = (x, y, z, val) => this.grid.set(x + 1, z + 1, y + 1, val)

  setLightingSides = (sides) => {
    for (let i = 0; i < sides.length; i++) {
      const { x, z, y, s, val } = sides[i];
      this.lighting.set(x, z, y, s, val)
    }
  }

  setSmoothLightingValues = (values) => {
    for (let i = 0; i < values.length; i++) {
      const { x, z, y, s, f, c, val } = values[i];
      this.lighting.set(x, z, y, s, f, c, val)
    }
  }

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
