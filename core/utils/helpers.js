/* eslint-disable no-console */

import Config from '../config/config'

const SIZE = Config.chunk.size
const DIMENSION = Config.block.dimension

const projectTag = '[SkyfactoryJS]'

class Helpers {
  static log = (message, pt = false) => console.log(pt ? `${projectTag} ${message}` : message)

  static warn = (warning, pt = false) => console.warn(pt ? `${projectTag} ${warning}` : warning)

  static error = (error, pt = false) => console.error(pt ? `${projectTag} ${error}` : error)

  static get2DCoordsRep = (x, z, semi = false) => {
    return `${x}:${z}${semi ? ';' : ''}`
  }

  static get3DCoordsRep = (x, y, z, semi = false) => {
    return `${x}:${y}:${z}${semi ? ';' : ''}`
  }

  static get2DCoordsFromRep = rep => {
    const [x, z] = rep.split(':')
    return { x: parseInt(x, 10), z: parseInt(z, 10) }
  }

  static get3DCoordsFromRep = rep => {
    const [x, y, z] = rep.split(':')
    return { x: parseInt(x, 10), y: parseInt(y, 10), z: parseInt(z, 10) }
  }

  /**
   * Converting global *block* position to chunk position
   *  (remember to convert to global block coords first!)
   */
  static blockToChunk = ({ x, y, z }) => ({
    coordx: Math.floor(x / SIZE),
    coordy: Math.floor(y / SIZE),
    coordz: Math.floor(z / SIZE)
  })

  /**
   * Converts global block coords to chunk block coords
   */
  static toLocalBlockCoords = ({ x: gx, y: gy, z: gz }) => {
    const { coordx, coordy, coordz } = this.toChunkCoords({ x: gx, y: gy, z: gz })

    return {
      x: Math.floor(gx - coordx * SIZE),
      y: Math.floor(gy - coordy * SIZE),
      z: Math.floor(gz - coordz * SIZE)
    }
  }

  /**
   * Converts chunk block coords to global block coords
   */
  static chunkBlockToGlobalBlock = ({ x: bx, y: by, z: bz, coordx, coordy, coordz }) => ({
    x: coordx * SIZE + bx,
    y: coordy * SIZE + by,
    z: coordz * SIZE + bz
  })

  /**
   * Converts global block coords to world block coords
   */
  static globalBlockToWorld = ({ x, y, z }) => ({
    x: x * DIMENSION,
    y: y * DIMENSION,
    z: z * DIMENSION
  })

  /**
   * Rounding precision of position
   * @param { object } position - position to round contianing x, y and z.
   */
  static roundPos = ({ x, y, z }, dec) => {
    x = Math.round(x * 10 ** dec) / 10 ** dec
    y = Math.round(y * 10 ** dec) / 10 ** dec
    z = Math.round(z * 10 ** dec) / 10 ** dec
    return { x, y, z }
  }

  static round(value, decimals) {
    return Number(`${Math.round(`${value}e${decimals}`)}e-${decimals}`)
  }

  /**
   * Converting global coordinates to global block coordinates.
   */
  static worldToBlock = ({ x, y, z }, floor = true) => {
    x = parseFloat(x.toFixed(10))
    y = parseFloat(y.toFixed(10))
    z = parseFloat(z.toFixed(10))
    return floor
      ? {
          x: Math.floor(x / DIMENSION),
          y: Math.floor(y / DIMENSION),
          z: Math.floor(z / DIMENSION)
        }
      : {
          x: x / DIMENSION,
          y: y / DIMENSION,
          z: z / DIMENSION
        }
  }

  static approxEquals = (float1, float2, epsilon = 1e-5) => Math.abs(float1 - float2) < epsilon

  static isString = test => typeof test === 'string'

  static applyStyle = (ele, s) => {
    if (typeof s === 'object') Object.keys(s).forEach(key => (ele.style[key] = s[key]))
    else ele.classList.add(s)
  }

  static toRadian = degree => (degree * Math.PI) / 180

  static binarySearch(arr, ele, func) {
    let l = 0
    let h = arr.length - 1
    let m
    let comparison

    func =
      func ||
      function(a, b) {
        return a < b ? -1 : a > b ? 1 : 0 /* default comparison method if one was not provided */
      }

    while (l <= h) {
      m = (l + h) >>> 1 /* equivalent to Math.floor((l + h) / 2) but faster */
      comparison = func(arr[m], ele)
      if (comparison < 0) {
        l = m + 1
      } else if (comparison > 0) {
        h = m - 1
      } else {
        return m
      }
    }
    return ~l
  }

  static binaryInsert(arr, ele, func, duplicate = false) {
    let i = Helpers.binarySearch(arr, ele, func)

    if (i >= 0) {
      if (!duplicate) return i
    } else i = ~i

    return i
  }
}

export default Helpers
