import * as THREE from 'three'

import Resources from '../Resources'
import Config from '../../Config'

const DIMENSION = Config.block.dimension,
  R_LIGHTING = Config.lighting.day,
  SL_DIFF = Config.lighting.slDifference
const R_BLOCK = Resources.geometries.block

class BlockGeometryManager {
  constructor() {
    this.geometries = {}
  }

  load = () => {
    for (let key in R_BLOCK) {
      this.geometries[key] = new THREE.PlaneGeometry(DIMENSION, DIMENSION)
      const { func, rotation } = R_BLOCK[key]
      // this.geometries[key].computeFaceNormals()
      if (func && Array.isArray(func)) {
        for (let i = 0; i < func.length; i++) {
          this.geometries[key][func[i]](rotation[i])
        }
      } else if (func) {
        this.geometries[key][func](rotation)
      }
    }
  }

  get = key => this.geometries[key]

  getWLighting = (key, lighting, smoothLighting) => {
    const light = new THREE.Color(
      `rgb(${R_LIGHTING[lighting]},${R_LIGHTING[lighting]},${
        R_LIGHTING[lighting]
      })`
    )
    const shadow =
      R_LIGHTING[lighting] - SL_DIFF >= 0
        ? new THREE.Color(
            `rgb(${R_LIGHTING[lighting] - SL_DIFF},${R_LIGHTING[lighting] -
              SL_DIFF},${R_LIGHTING[lighting] - SL_DIFF})`
          )
        : new THREE.Color(`rgb(0,0,0)`)

    const geo = this.geometries[key]

    switch (key) {
      case 'px':
      case 'nx':
      case 'pz':
      case 'nz':
      case 'px2':
      case 'nx2':
      case 'pz2':
      case 'nz2':
        geo.faces[0].vertexColors = [light, shadow, light]
        geo.faces[1].vertexColors = [shadow, shadow, light]
        break
      case 'py':
      case 'ny':
      case 'py2':
      case 'ny2':
        geo.faces[0].vertexColors = [light, light, light]
        geo.faces[1].vertexColors = [light, light, light]
        break
      default:
        break
    }

    if (smoothLighting) {
      for (let m = 0; m < 2; m++) {
        const colors = new Array(3)
        for (let n = 0; n < 3; n++) {
          colors[n] =
            smoothLighting[m][n] === 1
              ? shadow
              : smoothLighting[m][n] === 2
              ? light
              : shadow
        }
        geo.faces[m].vertexColors = colors
      }
    }
    return geo
  }
}

export default BlockGeometryManager
