/* eslint-disable no-unused-vars, no-undef, no-restricted-globals, eslint-disable-line  */

export default () => {
  /**
   * HELPER FUNCTIONS
   */
  function getCoordsRepresentation(x, y, z, semi = false) {
    return `${x}:${y}:${z}${semi ? ';' : ''}`
  }

  function calcQuads(get, getLighting, getSmoothLightingSide, dims) {
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
          if (get(x, z, y + 1) === 0) {
            const smoothLightingSide = getSmoothLightingSide(wx, wz, wy, 0)
            const geo = smoothLightingSide[2][0] !== 1 ? 'py' : 'py2'
            planes.push([
              [wx + 0.5, wy + 1, wz + 0.5],
              geo,
              type,
              materials.top,
              getLighting(wx, wz, wy, 0),
              smoothLightingSide
            ]);
          }


          // SIDES
          if (get(x + 1, z, y) === 0) {
            const smoothLightingSide = getSmoothLightingSide(wx, wz, wy, 1)
            const geo = smoothLightingSide[2][0] !== 1 ? 'px' : 'px2'
            planes.push([
              [wx + 1, wy + 0.5, wz + 0.5],
              geo,
              type,
              materials.side,
              getLighting(wx, wz, wy, 1),
              smoothLightingSide
            ]);
          }

          if (get(x, z + 1, y) === 0) {
            const smoothLightingSide = getSmoothLightingSide(wx, wz, wy, 2)
            const geo = smoothLightingSide[2][0] !== 1 ? 'pz' : 'pz2'
            planes.push([
              [wx + 0.5, wy + 0.5, wz + 1],
              geo,
              type,
              materials.side,
              getLighting(wx, wz, wy, 2),
              smoothLightingSide
            ]);
          }

          if (get(wx, z, y) === 0) {
            const smoothLightingSide = getSmoothLightingSide(wx, wz, wy, 3)
            const geo = smoothLightingSide[2][0] !== 1 ? 'nx' : 'nx2'
            planes.push([
              [wx, wy + 0.5, wz + 0.5],
              geo,
              type,
              materials.side,
              getLighting(wx, wz, wy, 3),
              smoothLightingSide,
            ]);
          }

          if (get(x, wz, y) === 0) {
            const smoothLightingSide = getSmoothLightingSide(wx, wz, wy, 4)
            const geo = smoothLightingSide[2][0] !== 1 ? 'nz' : 'nz2'
            planes.push([
              [wx + 0.5, wy + 0.5, wz],
              geo,
              type,
              materials.side,
              getLighting(wx, wz, wy, 4),
              smoothLightingSide
            ]);
          }


          // BOTTOM
          if (get(x, z, wy) === 0)
            planes.push([
              [wx + 0.5, wy, wz + 0.5],
              "ny",
              type,
              materials.bottom,
              getLighting(wx, wz, wy, 5),
              getSmoothLightingSide(wx, wz, wy, 5)
            ]);
        }
      }
    }
    return planes;
  }
}
