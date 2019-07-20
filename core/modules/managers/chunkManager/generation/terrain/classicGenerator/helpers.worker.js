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

  function calcPlanes(arr, dims, coordx, coordy, coordz) {
    const {
      block: { transparent: TRANSPARENT_BLOCKS, liquid: LIQUID_BLOCKS }
    } = self.config

    const planes = []

    for (let x = 1; x < dims[0] - 1; x++) {
      for (let z = 1; z < dims[2] - 1; z++) {
        for (let y = 1; y < dims[1] - 1; y++) {
          // dismiss air
          const type = self.get(arr, x, z, y)

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
          const top = self.get(arr, x, z, y + 1)
          if (!top || (TRANSPARENT_BLOCKS.includes(top) && !isSelfTransparent))
            planes.push(['py', pos, 'top', type])

          // SIDES
          const px = self.get(arr, x + 1, z, y)
          if (!px || (TRANSPARENT_BLOCKS.includes(px) && !isSelfTransparent))
            planes.push(['px', pos, 'side', type])

          const pz = self.get(arr, x, z + 1, y)
          if (!pz || (TRANSPARENT_BLOCKS.includes(pz) && !isSelfTransparent))
            planes.push(['pz', pos, 'side', type])

          const nx = self.get(arr, x - 1, z, y)
          if (!nx || (TRANSPARENT_BLOCKS.includes(nx) && !isSelfLiquid))
            planes.push(['nx', pos, 'side', type])

          const nz = self.get(arr, x, z - 1, y)
          if (!nz || (TRANSPARENT_BLOCKS.includes(nz) && !isSelfLiquid))
            planes.push(['nz', pos, 'side', type])

          // BOTTOM
          const bottom = self.get(arr, x, z, y - 1)
          if (!bottom || (TRANSPARENT_BLOCKS.includes(bottom) && !isSelfLiquid))
            planes.push(['ny', pos, 'bottom', type])
        }
      }
    }

    return planes
  }
}
