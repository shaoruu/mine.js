import * as THREE from 'three'
import Config from '../Data/Config'

const size = Config.chunk.size,
  dimension = Config.block.dimension

export default class Helpers {
  static mergeMeshes = (meshes, resourceManager, toBufferGeometry = true) => {
    let finalGeometry,
      materials = [],
      mergedGeometry = new THREE.Geometry(),
      mergedMesh

    const matrix = new THREE.Matrix4()

    // const start = performance.now()
    for (let i = 0; i < meshes.length; i++) {
      const { geo, pos, mat } = meshes[i]

      matrix.makeTranslation(...pos)

      mergedGeometry.merge(resourceManager.getBlockGeo(geo), matrix, i)
      materials.push(mat)
    }
    // const end = performance.now()
    // if (end - start > 1) console.log(meshes)

    // mergedGeometry.groupsNeedUpdate = true

    if (toBufferGeometry)
      finalGeometry = new THREE.BufferGeometry().fromGeometry(mergedGeometry)
    else finalGeometry = mergedGeometry

    mergedMesh = new THREE.Mesh(finalGeometry, materials)
    mergedMesh.geometry.computeFaceNormals()
    // mergedMesh.geometry.computeVertexNormals()

    return mergedMesh
  }
  static round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)
  }
  static getCoordsRepresentation(x, y, z, semi = false) {
    return `${x}:${y}:${z}${semi ? ';' : ''}`
  }
  static log(message) {
    console.log('[MinecraftJS] ' + message)
  }

  /**
   * Generates UVs for geometry
   */
  static boxUnwrapUVs(geometry) {
    if (!geometry.boundingBox) geometry.computeBoundingBox()
    let sz = geometry.boundingBox.getSize(new THREE.Vector3())
    // let center = geometry.boundingBox.getCenter(new THREE.Vector3())
    let min = geometry.boundingBox.min
    if (geometry.faceVertexUvs[0].length === 0) {
      for (let i = 0; i < geometry.faces.length; i++) {
        geometry.faceVertexUvs[0].push([
          new THREE.Vector2(),
          new THREE.Vector2(),
          new THREE.Vector2()
        ])
      }
    }
    for (let i = 0; i < geometry.faces.length; i++) {
      // let face = geometry.faces[i]
      let faceUVs = geometry.faceVertexUvs[0][i]
      let va = geometry.vertices[geometry.faces[i].a]
      let vb = geometry.vertices[geometry.faces[i].b]
      let vc = geometry.vertices[geometry.faces[i].c]
      let vab = new THREE.Vector3().copy(vb).sub(va)
      let vac = new THREE.Vector3().copy(vc).sub(va)
      //now we have 2 vectors to get the cross product of...
      let vcross = new THREE.Vector3().copy(vab).cross(vac)
      //Find the largest axis of the plane normal...
      vcross.set(Math.abs(vcross.x), Math.abs(vcross.y), Math.abs(vcross.z))
      let majorAxis =
        vcross.x > vcross.y
          ? vcross.x > vcross.z
            ? 'x'
            : vcross.y > vcross.z
            ? 'y'
            : vcross.y > vcross.z
          : vcross.y > vcross.z
          ? 'y'
          : 'z'
      //Take the other two axis from the largest axis
      let uAxis = majorAxis === 'x' ? 'y' : majorAxis === 'y' ? 'x' : 'x'
      let vAxis = majorAxis === 'x' ? 'z' : majorAxis === 'y' ? 'z' : 'y'
      faceUVs[0].set(
        (va[uAxis] - min[uAxis]) / sz[uAxis],
        (va[vAxis] - min[vAxis]) / sz[vAxis]
      )
      faceUVs[1].set(
        (vb[uAxis] - min[uAxis]) / sz[uAxis],
        (vb[vAxis] - min[vAxis]) / sz[vAxis]
      )
      faceUVs[2].set(
        (vc[uAxis] - min[uAxis]) / sz[uAxis],
        (vc[vAxis] - min[vAxis]) / sz[vAxis]
      )
    }
    geometry.elementsNeedUpdate = geometry.verticesNeedUpdate = true
  }

  /**
   * Update geometry's UV (s, t) values.
   */
  static updateTextureParams = (geo, sMin, sMax, tMin, tMax) => {
    let elt = geo.faceVertexUvs[0]
    let face0 = elt[0]
    face0[0] = new THREE.Vector2(sMin, tMin)
    face0[1] = new THREE.Vector2(sMax, tMin)
    face0[2] = new THREE.Vector2(sMin, tMax)
    let face1 = elt[1]
    face1[0] = new THREE.Vector2(sMax, tMin)
    face1[1] = new THREE.Vector2(sMax, tMax)
    face1[2] = new THREE.Vector2(sMin, tMax)
    geo.uvsNeedUpdate = true
  }

  /**
   * Rounding precision of position
   * @param { object } position - position to round contianing x, y and z.
   */
  static roundPos = ({ x, y, z }, dec) => {
    x = Math.round(x * Math.pow(10, dec)) / Math.pow(10, dec)
    y = Math.round(y * Math.pow(10, dec)) / Math.pow(10, dec)
    z = Math.round(z * Math.pow(10, dec)) / Math.pow(10, dec)
    return { x, y, z }
  }

  /**
   * Converting global coordinates to global block coordinates.
   */
  static toGlobalBlock = ({ x, y, z }, floor = true) => {
    x = parseFloat(x.toFixed(10))
    y = parseFloat(y.toFixed(10))
    z = parseFloat(z.toFixed(10))
    return floor
      ? {
          x: Math.floor(x / dimension),
          y: Math.floor(y / dimension),
          z: Math.floor(z / dimension)
        }
      : {
          x: x / dimension,
          y: y / dimension,
          z: z / dimension
        }
  }

  /**
   * Converting global *block* position to chunk position (remember to convert to global block coords first!)
   */
  static toChunkCoords = ({ x, y, z }) => ({
    coordx: Math.floor(x / size),
    coordy: Math.floor(y / size),
    coordz: Math.floor(z / size)
  })

  /**
   * Converting global position to block coords within chunk
   */
  static toBlockCoords = ({ x, y, z }) => {
    const { coordx, coordy, coordz } = this.toChunkCoords({ x, y, z })
    return {
      x: Math.floor(x - coordx * size),
      y: Math.floor(y - coordy * size),
      z: Math.floor(z - coordz * size)
    }
  }

  static applyStyle = (ele, s) => {
    if (typeof s === 'object')
      Object.keys(s).forEach(key => (ele.style[key] = s[key]))
    else ele.classList.add(s)
  }

  static toRadian = degree => (degree * Math.PI) / 180

  static mapVecToWorldCoords = (origin, vec) => [
    origin.x * size * dimension + vec[0] * dimension,
    origin.y * size * dimension + vec[1] * dimension,
    origin.z * size * dimension + vec[2] * dimension
  ]

  static approxEquals = (float1, float2, epsilon = 1e-5) =>
    Math.abs(float1 - float2) < epsilon
}
