import * as THREE from 'three'

import Resources from '../Resources'
import Config from '../../Config'

const dimension = Config.block.dimension
const rBlock = Resources.geometries.block

class BlockGeometryManager {
  constructor() {
    this.geometries = {}
  }

  load = () => {
    for (let key in rBlock) {
      this.geometries[key] = new THREE.PlaneGeometry(dimension, dimension)
      const { func, rotation } = rBlock[key]
      if (func) this.geometries[key][func](rotation)
      this.geometries[key].computeFaceNormals()
    }
  }

  get = key => this.geometries[key]
}

export default BlockGeometryManager
