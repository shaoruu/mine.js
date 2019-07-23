import Helpers from '../../../utils/helpers'
import Config from '../../../config/config'

import * as THREE from 'three'

const LEVEL_OF_DETAIL = Config.scene.lod
const NEIGHBOR_WIDTH = Config.chunk.neighborWidth
const TRANSPARENT_BLOCKS = Config.block.transparent
const LIQUID_BLOCKS = Config.block.liquid

class Mesher {
  static getSmoothLightingSide = (smoothLighting, i, j, k, l) => {
    if (smoothLighting.get(i, j, k, l, 0, 0) === 0) return null
    const output = new Array(3)
    for (let m = 0; m < 3; m++) {
      output[m] = new Uint8Array(3)
      for (let n = 0; n < 3; n++) {
        output[m][n] = smoothLighting.get(i, j, k, l, m, n)
      }
    }
    return output
  }

  static generateMeshData = (planes, geoManager) => {
    if (!planes || planes.length === 0) return null

    const materials = []
    const mergedGeometry = new THREE.Geometry()
    const matrix = new THREE.Matrix4()

    for (let i = 0; i < planes.length; i++) {
      const [geo, pos, face, type, lighting, smoothLighting] = planes[i]

      const { x, y, z } = pos
      const {
        geometry,
        translation: { x: dx, y: dy, z: dz }
      } = geoManager.getWLighting(geo, lighting, smoothLighting, type)
      const { x: wx, y: wy, z: wz } = Helpers.globalBlockToWorld({
        x: x + dx,
        y: y + dy,
        z: z + dz
      })

      matrix.makeTranslation(wx, wy, wz)
      mergedGeometry.merge(geometry, matrix, i)

      materials.push([type, geo, face])
    }

    const finalGeometry = new THREE.BufferGeometry().fromGeometry(mergedGeometry)

    return [finalGeometry.toJSON(), materials]
  }

  static processMeshData = (finalGeometryJSON, materials, resourceManager) => {
    const parser = new THREE.BufferGeometryLoader()

    const actualGeo = parser.parse(finalGeometryJSON)
    const actualMats = []

    materials.forEach(([type, geo, face]) =>
      actualMats.push(resourceManager.getMaterial(type, geo, face))
    )

    const finalMesh = new THREE.Mesh(actualGeo, actualMats)
    const finalLOD = new THREE.LOD()

    finalMesh.matrixAutoUpdate = false
    finalMesh.updateMatrix()

    for (let i = 0; i < LEVEL_OF_DETAIL; i++) finalLOD.addLevel(finalMesh, i * 75)

    return finalMesh
  }

  static calcPlanes(voxelData, lighting, smoothLighting, dims, coordx, coordy, coordz) {
    const planes = []

    for (let x = NEIGHBOR_WIDTH; x < dims[0] - NEIGHBOR_WIDTH; x++) {
      for (let z = NEIGHBOR_WIDTH; z < dims[2] - NEIGHBOR_WIDTH; z++) {
        for (let y = NEIGHBOR_WIDTH; y < dims[1] - NEIGHBOR_WIDTH; y++) {
          // dismiss air
          const type = voxelData.get(x, z, y)

          if (type === 0) continue

          const wx = x - NEIGHBOR_WIDTH
          const wy = y - NEIGHBOR_WIDTH
          const wz = z - NEIGHBOR_WIDTH

          const pos = Helpers.chunkBlockToGlobalBlock({
            x: wx,
            y: wy,
            z: wz,
            coordx,
            coordy,
            coordz
          })

          const isSelfTransparent = !!TRANSPARENT_BLOCKS.includes(type)
          const isSelfLiquid = !!LIQUID_BLOCKS.includes(type)

          // TOP
          const top = voxelData.get(x, z, y + 1)
          if (!top || (TRANSPARENT_BLOCKS.includes(top) && !isSelfTransparent)) {
            const smoothLightingSide = this.getSmoothLightingSide(smoothLighting, wx, wz, wy, 0)
            const geo = smoothLightingSide === null || smoothLightingSide[2][0] !== 1 ? 'py' : 'py2'
            planes.push([geo, pos, 'top', type, lighting.get(wx, wz, wy, 0), smoothLightingSide])
          }

          // SIDES
          const px = voxelData.get(x + 1, z, y)
          if (!px || (TRANSPARENT_BLOCKS.includes(px) && !isSelfTransparent)) {
            const smoothLightingSide = this.getSmoothLightingSide(smoothLighting, wx, wz, wy, 1)
            const geo = smoothLightingSide === null || smoothLightingSide[2][0] !== 1 ? 'px' : 'px2'
            planes.push([geo, pos, 'side', type, lighting.get(wx, wz, wy, 1), smoothLightingSide])
          }

          const pz = voxelData.get(x, z + 1, y)
          if (!pz || (TRANSPARENT_BLOCKS.includes(pz) && !isSelfTransparent)) {
            const smoothLightingSide = this.getSmoothLightingSide(smoothLighting, wx, wz, wy, 2)
            const geo = smoothLightingSide === null || smoothLightingSide[2][0] !== 1 ? 'pz' : 'pz2'
            planes.push([geo, pos, 'side', type, lighting.get(wx, wz, wy, 2), smoothLightingSide])
          }

          const nx = voxelData.get(x - 1, z, y)
          if (!nx || (TRANSPARENT_BLOCKS.includes(nx) && !isSelfLiquid)) {
            const smoothLightingSide = this.getSmoothLightingSide(smoothLighting, wx, wz, wy, 3)
            const geo = smoothLightingSide === null || smoothLightingSide[2][0] !== 1 ? 'nx' : 'nx2'
            planes.push([geo, pos, 'side', type, lighting.get(wx, wz, wy, 3), smoothLightingSide])
          }

          const nz = voxelData.get(x, z - 1, y)
          if (!nz || (TRANSPARENT_BLOCKS.includes(nz) && !isSelfLiquid)) {
            const smoothLightingSide = this.getSmoothLightingSide(smoothLighting, wx, wz, wy, 4)
            const geo = smoothLightingSide === null || smoothLightingSide[2][0] !== 1 ? 'nz' : 'nz2'
            planes.push([geo, pos, 'side', type, lighting.get(wx, wz, wy, 4), smoothLightingSide])
          }

          // BOTTOM
          const bottom = voxelData.get(x, z, y - 1)
          if (!bottom || (TRANSPARENT_BLOCKS.includes(bottom) && !isSelfLiquid)) {
            const smoothLightingSide = this.getSmoothLightingSide(smoothLighting, wx, wz, wy, 5)
            const geo = smoothLightingSide === null || smoothLightingSide[2][0] !== 1 ? 'ny' : 'ny2'
            planes.push([geo, pos, 'bottom', type, lighting.get(wx, wz, wy, 5), smoothLightingSide])
          }
        }
      }
    }

    return planes
  }
}

export default Mesher
