import ndarray from 'ndarray'
import * as THREE from 'three'

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

    const lightingArr = new Uint16Array(size ** 3 * 6)
    this.lighting = new ndarray(lightingArr, [size, size, size, 6])

    const smoothLightingArr = new Uint16Array(size ** 3 * 6 * 3 * 3)
    this.smoothLighting = new ndarray(smoothLightingArr, [size, size, size, 6, 3, 3])

    this.isLoaded = false

    this.blocksInProgress = {}

    this.geoParser = new THREE.BufferGeometryLoader()
  }

  generateMesh = combined => {
    if (!combined) {
      this.meshes = null
      return
    }

    const { geo, materials } = combined
    const actualMat = []
    const actualGeo = this.geoParser.parse(geo)

    for (let i = 0; i < materials.length; i++)
      actualMat.push(this.resourceManager.getBlockMat(...materials[i]))

    this.mesh = new THREE.Mesh(actualGeo, actualMat)
    this.mesh.name = this.name
    this.mesh.isChunk = true
  }

  setGrid = blocks => (this.grid.data = blocks)

  setLighting = lighting => (this.lighting.data = lighting)

  setSmoothLighting = smoothLighting => (this.smoothLighting.data = smoothLighting)

  setBlock = (x, y, z, val) => this.grid.set(x + 1, z + 1, y + 1, val)

  setLightingSides = sides => {
    for (let i = 0; i < sides.length; i++) {
      const { x, z, y, s, val } = sides[i]
      this.lighting.set(x, z, y, s, val)
    }
  }

  setSmoothLightingValues = values => {
    for (let i = 0; i < values.length; i++) {
      const { x, z, y, s, f, c, val } = values[i]
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
