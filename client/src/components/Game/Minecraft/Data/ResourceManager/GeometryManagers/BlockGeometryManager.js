import * as THREE from 'three'

import Resources from '../Resources'
import Config from '../../Config'

const dimension = Config.block.dimension
const rBlock = Resources.geometries.block
const rLighting = Resources.lighting.day

class BlockGeometryManager {
  constructor() {
    this.geometries = {}
  }

  load = () => {
    for (let key in rBlock) {
      this.geometries[key] = new THREE.PlaneGeometry(dimension, dimension)
      const { func, rotation } = rBlock[key]
      switch (key) {
        case "px":
        case "nx":
        case "pz":
        case 'nz':
        case "px2":
        case "nx2":
        case "pz2":
        case 'nz2':
          this.geometries[key].faceVertexUvs[0][0][0].y = 0.5;
          this.geometries[key].faceVertexUvs[0][0][2].y = 0.5;
          this.geometries[key].faceVertexUvs[0][1][2].y = 0.5;
          break
        case "py":
        case "ny":
        case "py2":
        case "ny2":
          this.geometries[key].faceVertexUvs[0][0][1].y = 0.5;
          this.geometries[key].faceVertexUvs[0][1][0].y = 0.5;
          this.geometries[key].faceVertexUvs[0][1][1].y = 0.5;
          break
        default:
          break
      }
      // this.geometries[key].computeFaceNormals()
      if (func && func.constructor === Array) {
        for (let i = 0; i < func.length; i++) {
          this.geometries[key][func[i]](rotation[i])
        }
      } else if (func) {
        this.geometries[key][func](rotation);
      }
    }
  }

  get = key => this.geometries[key]

  getWLighting = (key, lighting, smoothLighting) => {
    const light = new THREE.Color(`rgb(${rLighting[lighting]},${rLighting[lighting]},${rLighting[lighting]})`)
    const shadow = lighting > 0 ? new THREE.Color(`rgb(${rLighting[lighting - 1]},${rLighting[lighting - 1]},${rLighting[lighting - 1]})`) : light
    // const slDifference = 50

    // const light = new THREE.Color(`rgb(${lighting},${lighting},${lighting})`)
    // const shadow = lighting - slDifference > 0 ? new THREE.Color(`rgb(${lighting - slDifference},${lighting - slDifference},${lighting - slDifference})`) : new THREE.Color(`rgb(0,0,0)`)

    // const light = new THREE.Color(0xffffff);
    // const shadow = new THREE.Color(0x505050);

    const geo = this.geometries[key]

    switch (key) {
      case "px":
      case "nx":
      case "pz":
      case 'nz':
      case "px2":
      case "nx2":
      case "pz2":
      case 'nz2':
        geo.faces[0].vertexColors = [light, shadow, light]
        geo.faces[1].vertexColors = [shadow, shadow, light]
        break
      case "py":
      case "ny":
      case "py2":
      case "ny2":
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
          colors[n] = smoothLighting[m][n] === 1 ? shadow : smoothLighting[m][n] === 2 ? light : shadow
        }
        geo.faces[m].vertexColors = colors
      }
    }
    return geo
  }
}

export default BlockGeometryManager
