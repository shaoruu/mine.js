/* eslint-disable no-unused-vars, no-undef, no-restricted-globals, eslint-disable-line  */

export default () => {
  /**
   * HELPER FUNCTIONS
   */
  function getCoordsRepresentation(x, y, z, semi = false) {
    return `${x}:${y}:${z}${semi ? ';' : ''}`
  }

  function calcQuads(get, dims) {
    const planes = [],
      materials = { top: 'top', side: 'side', bottom: 'bottom' }

    for (let x = 1; x < dims[0] - 1; x++) {
      for (let z = 1; z < dims[2] - 1; z++) {
        for (let y = 1; y < dims[1] - 1; y++) {
          // dismiss air
          const type = get(x, z, y)

          if (type === 0) continue

          const wx = x - 1,
            wy = y - 1,
            wz = z - 1

          // TOP
          if (get(x, z, y + 1) === 0)
            planes.push([
              [wx + 0.5, wy + 1, wz + 0.5],
              'py',
              type,
              materials.top
            ])

          // SIDES
          if (get(x + 1, z, y) === 0)
            planes.push([
              [wx + 1, wy + 0.5, wz + 0.5],
              'px',
              type,
              materials.side
            ])
          if (get(x, z + 1, y) === 0)
            planes.push([
              [wx + 0.5, wy + 0.5, wz + 1],
              'pz',
              type,
              materials.side
            ])
          if (get(x - 1, z, y) === 0)
            planes.push([[wx, wy + 0.5, wz + 0.5], 'nx', type, materials.side])
          if (get(x, z - 1, y) === 0)
            planes.push([[wx + 0.5, wy + 0.5, wz], 'nz', type, materials.side])

          // BOTTOM
          if (get(x, z, y - 1) === 0)
            planes.push([
              [wx + 0.5, wy, wz + 0.5],
              'ny',
              type,
              materials.bottom
            ])
        }
      }
    }
    return planes
  }
}
