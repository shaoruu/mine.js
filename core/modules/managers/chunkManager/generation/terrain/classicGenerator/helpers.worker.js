/* eslint-disable no-unused-vars, no-undef, no-restricted-globals, eslint-disable-line  */

export default () => {
  /**
   * HELPER FUNCTIONS
   */
  function get3DCoordsRep(x, y, z, semi = false) {
    return `${x}:${y}:${z}${semi ? ';' : ''}`
  }

  function chunkBlockToGlobalBlock({ x: bx, y: by, z: bz, coordx, coordy, coordz }) {
    const { size: SIZE } = self.config

    return {
      x: coordx * SIZE + bx,
      y: coordy * SIZE + by,
      z: coordz * SIZE + bz
    }
  }

  function globalBlockToChunkCoords({ x, y, z }) {
    const { size: SIZE } = self.config

    return {
      coordx: Math.floor(x / SIZE),
      coordy: Math.floor(y / SIZE),
      coordz: Math.floor(z / SIZE)
    }
  }

  function calcPlanes(voxelData, lighting, smoothLighting, dims, coordx, coordy, coordz) {
    const {
      block: { transparent: TRANSPARENT_BLOCKS, liquid: LIQUID_BLOCKS }
    } = self.config

    const planes = []

    for (let x = 1; x < dims[0] - 1; x++) {
      for (let z = 1; z < dims[2] - 1; z++) {
        for (let y = 1; y < dims[1] - 1; y++) {
          // dismiss air
          const type = self.get(voxelData, x, z, y)

          if (type === 0) continue

          const wx = x - 1
          const wy = y - 1
          const wz = z - 1

          const pos = chunkBlockToGlobalBlock({
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
          const top = self.get(voxelData, x, z, y + 1)
          if (!top || (TRANSPARENT_BLOCKS.includes(top) && !isSelfTransparent)) {
            const smoothLightingSide = self.getSmoothLightingSide(smoothLighting, wx, wz, wy, 0)
            const geo = smoothLightingSide === null || smoothLightingSide[2][0] !== 1 ? 'py' : 'py2'
            planes.push([
              geo,
              pos,
              'top',
              type,
              self.getLighting(lighting, wx, wz, wy, 0),
              smoothLightingSide
            ])
          }

          // SIDES
          const px = self.get(voxelData, x + 1, z, y)
          if (!px || (TRANSPARENT_BLOCKS.includes(px) && !isSelfTransparent)) {
            const smoothLightingSide = self.getSmoothLightingSide(smoothLighting, wx, wz, wy, 1)
            const geo = smoothLightingSide === null || smoothLightingSide[2][0] !== 1 ? 'px' : 'px2'
            planes.push([
              geo,
              pos,
              'side',
              type,
              self.getLighting(lighting, wx, wz, wy, 1),
              smoothLightingSide
            ])
          }

          const pz = self.get(voxelData, x, z + 1, y)
          if (!pz || (TRANSPARENT_BLOCKS.includes(pz) && !isSelfTransparent)) {
            const smoothLightingSide = self.getSmoothLightingSide(smoothLighting, wx, wz, wy, 2)
            const geo = smoothLightingSide === null || smoothLightingSide[2][0] !== 1 ? 'pz' : 'pz2'
            planes.push([
              geo,
              pos,
              'side',
              type,
              self.getLighting(lighting, wx, wz, wy, 2),
              smoothLightingSide
            ])
          }

          const nx = self.get(voxelData, x - 1, z, y)
          if (!nx || (TRANSPARENT_BLOCKS.includes(nx) && !isSelfLiquid)) {
            const smoothLightingSide = self.getSmoothLightingSide(smoothLighting, wx, wz, wy, 3)
            const geo = smoothLightingSide === null || smoothLightingSide[2][0] !== 1 ? 'nx' : 'nx2'
            planes.push([
              geo,
              pos,
              'side',
              type,
              self.getLighting(lighting, wx, wz, wy, 3),
              smoothLightingSide
            ])
          }

          const nz = self.get(voxelData, x, z - 1, y)
          if (!nz || (TRANSPARENT_BLOCKS.includes(nz) && !isSelfLiquid)) {
            const smoothLightingSide = self.getSmoothLightingSide(smoothLighting, wx, wz, wy, 4)
            const geo = smoothLightingSide === null || smoothLightingSide[2][0] !== 1 ? 'nz' : 'nz2'
            planes.push([
              geo,
              pos,
              'side',
              type,
              self.getLighting(lighting, wx, wz, wy, 4),
              smoothLightingSide
            ])
          }

          // BOTTOM
          const bottom = self.get(voxelData, x, z, y - 1)
          if (!bottom || (TRANSPARENT_BLOCKS.includes(bottom) && !isSelfLiquid)) {
            const smoothLightingSide = self.getSmoothLightingSide(smoothLighting, wx, wz, wy, 5)
            const geo = smoothLightingSide === null || smoothLightingSide[2][0] !== 1 ? 'ny' : 'ny2'
            planes.push([
              geo,
              pos,
              'bottom',
              type,
              self.getLighting(lighting, wx, wz, wy, 5),
              smoothLightingSide
            ])
          }
        }
      }
    }

    return planes
  }
}
