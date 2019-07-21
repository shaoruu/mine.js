import Helpers from '../../../utils/helpers'

import * as THREE from 'three'

class Mesher {
  static mergeMeshes = (planes, resourceManager, toBufferGeometry = true) => {
    let finalGeometry
    const materials = []
    const mergedGeometry = new THREE.Geometry()
    const matrix = new THREE.Matrix4()

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

    if (toBufferGeometry) finalGeometry = new THREE.BufferGeometry().fromGeometry(mergedGeometry)
    else finalGeometry = mergedGeometry

    const mergedMesh = new THREE.Mesh(finalGeometry, materials)

    mergedMesh.matrixAutoUpdate = false
    mergedMesh.updateMatrix()

    return mergedMesh
  }
}

export default Mesher
