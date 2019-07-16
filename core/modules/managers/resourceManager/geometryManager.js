import Resources from '../../../config/resources'
import Config from '../../../config/config'

import * as THREE from 'three'

const DIMENSION = Config.block.dimension
const R_BLOCKS = Resources.geometries.blocks

class GeometryManager {
  constructor() {
    this.geometries = {}
  }

  load = () => {
    this.loadBlocks()
  }

  /* -------------------------------------------------------------------------- */
  /*                                   LOADERS                                  */
  /* -------------------------------------------------------------------------- */
  loadBlocks = () => {
    Object.keys(R_BLOCKS).forEach(key => {
      const { func, rotation, translation } = R_BLOCKS[key]
      this.geometries[key] = {
        geometry: new THREE.PlaneGeometry(DIMENSION, DIMENSION),
        translation
      }
      if (func) this.geometries[key].geometry[func](rotation)
    })
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  get = face => this.geometries[face]
}

export default GeometryManager
