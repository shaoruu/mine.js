/* eslint-disable no-unused-vars, no-undef, no-restricted-globals, eslint-disable-line  */

/**
 * HELPER FUNCTIONS
 */
export default () => {
  function get2DCoordsRep(x, z, semi = false) {
    return `${x}:${z}${semi ? ';' : ''}`
  }

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
      neighborWidth: NEIGHBOR_WIDTH,
      block: { transparent: TRANSPARENT_BLOCKS, liquid: LIQUID_BLOCKS }
    } = self.config

    const planes = []

    for (let x = NEIGHBOR_WIDTH; x < dims[0] - NEIGHBOR_WIDTH; x++) {
      for (let z = NEIGHBOR_WIDTH; z < dims[2] - NEIGHBOR_WIDTH; z++) {
        for (let y = NEIGHBOR_WIDTH; y < dims[1] - NEIGHBOR_WIDTH; y++) {
          // dismiss air
          const type = self.get(voxelData, x, z, y)

          if (type === 0) continue

          const wx = x - NEIGHBOR_WIDTH
          const wy = y - NEIGHBOR_WIDTH
          const wz = z - NEIGHBOR_WIDTH

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
          if (!nx || (TRANSPARENT_BLOCKS.includes(nx) && !isSelfLiquid && !isSelfTransparent)) {
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
          if (!nz || (TRANSPARENT_BLOCKS.includes(nz) && !isSelfLiquid && !isSelfTransparent)) {
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
          if (
            !bottom ||
            (TRANSPARENT_BLOCKS.includes(bottom) && !isSelfLiquid && !isSelfTransparent)
          ) {
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
