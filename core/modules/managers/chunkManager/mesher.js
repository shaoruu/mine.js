import Helpers from '../../../utils/helpers'
import Config from '../../../config/config'

import * as THREE from 'three'

const TRANSPARENT_BLOCKS = Config.block.transparent

class Mesher {
  static mergeMeshes = (quads, resourceManager, toBufferGeometry = true) => {
    let finalGeometry
    const materials = []
    const mergedGeometry = new THREE.Geometry()
    const matrix = new THREE.Matrix4()

    for (let i = 0; i < quads.length; i++) {
      const [geo, pos, face, type] = quads[i]

      const { x, y, z } = pos
      const {
        geometry,
        translation: { x: dx, y: dy, z: dz }
      } = resourceManager.getGeometry(geo)
      const { x: wx, y: wy, z: wz } = Helpers.globalBlockToWorld({
        x: x + dx,
        y: y + dy,
        z: z + dz
      })

      matrix.makeTranslation(wx, wy, wz)
      mergedGeometry.merge(geometry, matrix, i)

      materials.push(resourceManager.getMaterial(type, face))
    }

    if (toBufferGeometry) finalGeometry = new THREE.BufferGeometry().fromGeometry(mergedGeometry)
    else finalGeometry = mergedGeometry

    const mergedMesh = new THREE.Mesh(finalGeometry, materials)
    mergedMesh.geometry.computeFaceNormals()

    return mergedMesh
  }

  static meshChunk = (resourceManager, data, dims, coordx, coordy, coordz) => {
    const planes = []

    for (let x = 1; x < dims[0] - 1; x++) {
      for (let z = 1; z < dims[2] - 1; z++) {
        for (let y = 1; y < dims[1] - 1; y++) {
          // dismiss air
          const type = data.get(x, z, y)

          if (type === 0) continue

          const wx = x - 1
          const wy = y - 1
          const wz = z - 1

          const pos = Helpers.chunkBlockToGlobalBlock({
            x: wx,
            y: wy,
            z: wz,
            coordx,
            coordy,
            coordz
          })

          const isSelfTransparent = !!TRANSPARENT_BLOCKS.includes(type)

          // TOP
          const top = data.get(x, z, y + 1)
          if (!top || (TRANSPARENT_BLOCKS.includes(top) && !isSelfTransparent))
            planes.push(['py', pos, 'top', type])

          // SIDES
          const px = data.get(x + 1, z, y)
          if (!px || (TRANSPARENT_BLOCKS.includes(px) && !isSelfTransparent))
            planes.push(['px', pos, 'side', type])

          const pz = data.get(x, z + 1, y)
          if (!pz || (TRANSPARENT_BLOCKS.includes(pz) && !isSelfTransparent))
            planes.push(['pz', pos, 'side', type])

          const nx = data.get(x - 1, z, y)
          if (!nx || TRANSPARENT_BLOCKS.includes(nx)) planes.push(['nx', pos, 'side', type])

          const nz = data.get(x, z - 1, y)
          if (!nz || TRANSPARENT_BLOCKS.includes(nz)) planes.push(['nz', pos, 'side', type])

          // BOTTOM
          const bottom = data.get(x, z, y - 1)
          if (!bottom || TRANSPARENT_BLOCKS.includes(bottom))
            planes.push(['ny', pos, 'bottom', type])
        }
      }
    }

    const mesh = Mesher.mergeMeshes(planes, resourceManager)

    return mesh
  }
}

export default Mesher
