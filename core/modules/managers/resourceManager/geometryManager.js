import Resources from '../../../config/resources'
import Config from '../../../config/config'

import * as THREE from 'three'

const DIMENSION = Config.block.dimension
const LIGHTING_LVLS = Config.lights.aoConfigs.levels
const SL_DIFF = Config.lights.aoConfigs.slDifference
const LOWEST_LIGHT = Config.lights.aoConfigs.lowestLight
const LIQUID_BLOCKS = Config.block.liquid
const R_BLOCKS = Resources.geometries.blocks

class GeometryManager {
  constructor() {
    this.geometries = {}
    this.pures = {}
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
      if (func) {
        if (Array.isArray(func)) {
          for (let i = 0; i < func.length; i++) this.geometries[key].geometry[func[i]](rotation[i])
        } else this.geometries[key].geometry[func](rotation)
      }

      this.pures[key] = {
        geometry: this.geometries[key].geometry.clone(),
        translation: this.geometries[key].translation
      }
    })
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getPure = face => this.geometries[face]

  getWLighting = (key, lighting, smoothLighting, type) => {
    if (LIQUID_BLOCKS.includes(type)) return this.pures[key]

    const light = new THREE.Color(
      `rgb(${LIGHTING_LVLS[lighting]},${LIGHTING_LVLS[lighting]},${LIGHTING_LVLS[lighting]})`
    )

    const diff = LIGHTING_LVLS[lighting] - SL_DIFF
    const shadow =
      diff >= LOWEST_LIGHT
        ? new THREE.Color(`rgb(${diff},${diff},${diff})`)
        : new THREE.Color(`rgb(${LOWEST_LIGHT},${LOWEST_LIGHT},${LOWEST_LIGHT})`)

    const geoData = this.geometries[key]

    geoData.geometry.faces[0].vertexColors = [light, light, light]
    geoData.geometry.faces[1].vertexColors = [light, light, light]

    if (smoothLighting) {
      for (let f = 0; f < 2; f++) {
        const colors = new Array(3)
        for (let c = 0; c < 3; c++) {
          colors[c] =
            smoothLighting[f][c] === 1 ? shadow : smoothLighting[f][c] === 2 ? light : shadow
        }
        geoData.geometry.faces[f].vertexColors = colors
      }
    }

    return geoData
  }
}

export default GeometryManager
