/* eslint-disable no-unused-vars, no-undef, no-restricted-globals, eslint-disable-line  */

export default () => {
  /**
   * HELPER FUNCTIONS
   */
  function getCoordsRepresentation(x, y, z, semi = false) {
    return `${x}:${y}:${z}${semi ? ';' : ''}`
  }

  function calcPlanes(get, dims) {
    const planes = []

    for (let x = 1; x < dims[0] - 1; x++) {
      for (let z = 1; z < dims[2] - 1; z++) {
        for (let y = 1; y < dims[1] - 1; y++) {
          // dismiss air
          const type = get(x, z, y)

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
          const top = get(x, z, y + 1)
          if (!top || (TRANSPARENT_BLOCKS.includes(top) && !isSelfTransparent))
            planes.push(['py', pos, 'top', type])

          // SIDES
          const px = get(x + 1, z, y)
          if (!px || (TRANSPARENT_BLOCKS.includes(px) && !isSelfTransparent))
            planes.push(['px', pos, 'side', type])

          const pz = get(x, z + 1, y)
          if (!pz || (TRANSPARENT_BLOCKS.includes(pz) && !isSelfTransparent))
            planes.push(['pz', pos, 'side', type])

          const nx = get(x - 1, z, y)
          if (!nx || TRANSPARENT_BLOCKS.includes(nx)) planes.push(['nx', pos, 'side', type])

          const nz = get(x, z - 1, y)
          if (!nz || TRANSPARENT_BLOCKS.includes(nz)) planes.push(['nz', pos, 'side', type])

          // BOTTOM
          const bottom = get(x, z, y - 1)
          if (!bottom || TRANSPARENT_BLOCKS.includes(bottom))
            planes.push(['ny', pos, 'bottom', type])
        }
      }
    }

    return planes
  }

  function calcQuads(get, dims) {
    const planes = []
    const materials = { top: 'top', side: 'side', bottom: 'bottom' }

    for (let x = 1; x < dims[0] - 1; x++) {
      for (let z = 1; z < dims[2] - 1; z++) {
        for (let y = 1; y < dims[1] - 1; y++) {
          // dismiss air
          const type = get(x, z, y)

          if (type === 0) continue

          const wx = x - 1
          const wy = y - 1
          const wz = z - 1

          // TOP
          if (get(x, z, y + 1) === 0)
            planes.push([[wx + 0.5, wy + 1, wz + 0.5], 'py', type, materials.top])

          // SIDES
          if (get(x + 1, z, y) === 0)
            planes.push([[wx + 1, wy + 0.5, wz + 0.5], 'px', type, materials.side])
          if (get(x, z + 1, y) === 0)
            planes.push([[wx + 0.5, wy + 0.5, wz + 1], 'pz', type, materials.side])
          if (get(x - 1, z, y) === 0)
            planes.push([[wx, wy + 0.5, wz + 0.5], 'nx', type, materials.side])
          if (get(x, z - 1, y) === 0)
            planes.push([[wx + 0.5, wy + 0.5, wz], 'nz', type, materials.side])

          // BOTTOM
          if (get(x, z, y - 1) === 0)
            planes.push([[wx + 0.5, wy, wz + 0.5], 'ny', type, materials.bottom])
        }
      }
    }
    return planes
  }
}
