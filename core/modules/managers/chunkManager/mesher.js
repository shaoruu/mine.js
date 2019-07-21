import Helpers from '../../../utils/helpers'
import Config from '../../../config/config'

import * as THREE from 'three'

const LEVEL_OF_DETAIL = Config.scene.lod

class Mesher {
  static mergeMeshes = (planes, resourceManager) => {
    const materials = []
    const mergedGeometry = new THREE.Geometry()
    const matrix = new THREE.Matrix4()
    const finalLOD = new THREE.LOD()

    for (let i = 0; i < planes.length; i++) {
      const [geo, pos, face, type, lighting, smoothLighting] = planes[i]

      const { x, y, z } = pos
      const {
        geometry,
        translation: { x: dx, y: dy, z: dz }
      } = resourceManager.getGeometryWLighting(geo, lighting, smoothLighting, type)
      const { x: wx, y: wy, z: wz } = Helpers.globalBlockToWorld({
        x: x + dx,
        y: y + dy,
        z: z + dz
      })

      matrix.makeTranslation(wx, wy, wz)
      mergedGeometry.merge(geometry, matrix, i)

      materials.push(resourceManager.getMaterial(type, geo, face))
    }

    const finalGeometry = new THREE.BufferGeometry().fromGeometry(mergedGeometry)
    const mergedMesh = new THREE.Mesh(finalGeometry, materials)

    mergedMesh.matrixAutoUpdate = false
    mergedMesh.updateMatrix()

    for (let i = 0; i < LEVEL_OF_DETAIL; i++) {
      finalLOD.addLevel(mergedMesh, i * 75)
    }

    return finalLOD
  }
}

export default Mesher
