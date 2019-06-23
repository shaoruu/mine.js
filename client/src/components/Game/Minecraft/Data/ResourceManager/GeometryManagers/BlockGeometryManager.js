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

    const diff = R_LIGHTING[lighting] - SL_DIFF
    const shadow =
      diff >= 30
        ? new THREE.Color(`rgb(${diff},${diff},${diff})`)
        : new THREE.Color(`rgb(30,30,30)`)

    const geo = this.geometries[key]

    geo.faces[0].vertexColors = [light, light, light]
    geo.faces[1].vertexColors = [light, light, light]

    if (smoothLighting) {
      for (let f = 0; f < 2; f++) {
        const colors = new Array(3)
        for (let c = 0; c < 3; c++) {
          colors[c] =
            smoothLighting[f][c] === 1
              ? shadow
              : smoothLighting[f][c] === 2
              ? light
              : shadow
        }
        geo.faces[f].vertexColors = colors
      }
    }
    return geo
  }
}

export default BlockGeometryManager
