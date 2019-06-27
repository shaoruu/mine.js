/* eslint-disable no-unused-vars, no-undef, no-restricted-globals, eslint-disable-line  */

export default () => {
  /**
   * HELPER FUNCTIONS
   */
  function setupGeometries() {
    const { geoResources: resources, dimension } = self.config

    self.geometries = {}

    for (let key in resources) {
      self.geometries[key] = new THREE.PlaneGeometry(dimension, dimension)
      const { func, rotation } = resources[key]

      if (func && Array.isArray(func)) {
        for (let i = 0; i < func.length; i++) {
          self.geometries[key][func[i]](rotation[i])
        }
      } else if (func) {
        self.geometries[key][func](rotation)
      }
    }
  }

  function getGeoWLighting(key, lighting, smoothLighting) {
    const { rLighting, slDiff } = self.config

    const light = new THREE.Color(
      `rgb(${rLighting[lighting]}, ${rLighting[lighting]}, ${rLighting[lighting]})`
    )
    const diff = rLighting[lighting] - slDiff
    const shadow =
      diff >= 30
        ? new THREE.Color(`rgb(${diff}, ${diff}, ${diff})`)
        : new THREE.Color(`rgb(30, 30, 30)`)

    const geo = self.geometries[key]

    geo.faces[0].vertexColors = [light, light, light]
    geo.faces[1].vertexColors = [light, light, light]

    if (smoothLighting) {
      for (let f = 0; f < 2; f++) {
        const colors = new Array(3)
        for (let c = 0; c < 3; c++) {
          colors[c] =
            smoothLighting[f][c] === 1
              ? shadow
              : smoothLighting[f][c] === 2
              ? light
              : shadow
        }
        geo.faces[f].vertexColors = colors
      }
    }
    return geo
  }

  function mapVecToWorldCoords(origin, vec) {
    const { size, dimension } = self.config
    return [
      origin.x * size * dimension + vec[0] * dimension,
      origin.y * size * dimension + vec[1] * dimension,
      origin.z * size * dimension + vec[2] * dimension
    ]
  }

  function getCoordsRepresentation(x, y, z, semi = false) {
    return `${x}:${y}:${z}${semi ? ';' : ''}`
  }

  function calcQuads(voxelData, lighting, smoothLighting, dims) {
    const planes = [],
      materials = { top: 'top', side: 'side', bottom: 'bottom' }

    for (let x = 1; x < dims[0] - 1; x++) {
      for (let z = 1; z < dims[2] - 1; z++) {
        for (let y = 1; y < dims[1] - 1; y++) {
          // dismiss air
          const type = self.get(voxelData, x, z, y)

          if (type === 0) continue

          const wx = x - 1,
            wy = y - 1,
            wz = z - 1

          // TOP
          if (self.get(voxelData, x, z, y + 1) === 0) {
            const smoothLightingSide = self.getSmoothLightingSide(
              smoothLighting,
              wx,
              wz,
              wy,
              0
            )
            const geo = smoothLightingSide[2][0] !== 1 ? 'py' : 'py2'
            planes.push([
              [wx + 0.5, wy + 1, wz + 0.5],
              geo,
              type,
              materials.top,
              self.getLighting(lighting, wx, wz, wy, 0),
              smoothLightingSide
            ])
          }

          // SIDES
          if (self.get(voxelData, x + 1, z, y) === 0) {
            const smoothLightingSide = self.getSmoothLightingSide(
              smoothLighting,
              wx,
              wz,
              wy,
              1
            )
            const geo = smoothLightingSide[2][0] !== 1 ? 'px' : 'px2'
            planes.push([
              [wx + 1, wy + 0.5, wz + 0.5],
              geo,
              type,
              materials.side,
              self.getLighting(lighting, wx, wz, wy, 1),
              smoothLightingSide
            ])
          }

          if (self.get(voxelData, x, z + 1, y) === 0) {
            const smoothLightingSide = self.getSmoothLightingSide(
              smoothLighting,
              wx,
              wz,
              wy,
              2
            )
            const geo = smoothLightingSide[2][0] !== 1 ? 'pz' : 'pz2'
            planes.push([
              [wx + 0.5, wy + 0.5, wz + 1],
              geo,
              type,
              materials.side,
              self.getLighting(lighting, wx, wz, wy, 2),
              smoothLightingSide
            ])
          }

          if (self.get(voxelData, wx, z, y) === 0) {
            const smoothLightingSide = self.getSmoothLightingSide(
              smoothLighting,
              wx,
              wz,
              wy,
              3
            )
            const geo = smoothLightingSide[2][0] !== 1 ? 'nx' : 'nx2'
            planes.push([
              [wx, wy + 0.5, wz + 0.5],
              geo,
              type,
              materials.side,
              self.getLighting(lighting, wx, wz, wy, 3),
              smoothLightingSide
            ])
          }

          if (self.get(voxelData, x, wz, y) === 0) {
            const smoothLightingSide = self.getSmoothLightingSide(
              smoothLighting,
              wx,
              wz,
              wy,
              4
            )
            const geo = smoothLightingSide[2][0] !== 1 ? 'nz' : 'nz2'
            planes.push([
              [wx + 0.5, wy + 0.5, wz],
              geo,
              type,
              materials.side,
              self.getLighting(lighting, wx, wz, wy, 4),
              smoothLightingSide
            ])
          }

          // BOTTOM
          if (self.get(voxelData, x, z, wy) === 0) {
            const smoothLightingSide = self.getSmoothLightingSide(
              smoothLighting,
              wx,
              wz,
              wy,
              5
            )
            const geo = smoothLightingSide[2][0] !== 1 ? 'ny' : 'ny2'
            planes.push([
              [wx + 0.5, wy, wz + 0.5],
              geo,
              type,
              materials.bottom,
              self.getLighting(lighting, wx, wz, wy, 5),
              self.getSmoothLightingSide(smoothLighting, wx, wz, wy, 5)
            ])
          }
        }
      }
    }
    return planes
  }

  function meshQuads(quads, coordx, coordy, coordz) {
    // Avoiding extra work.
    if (quads === undefined || quads.length === 0) return null

    const meshes = []

    for (let i = 0; i < quads.length; i++) {
      const globalCoords = mapVecToWorldCoords(
        { x: coordx, y: coordy, z: coordz },
        quads[i][0]
      )

      const mat = [quads[i][2], quads[i][1], quads[i][3]]

      meshes.push({
        geo: quads[i][1],
        pos: globalCoords,
        mat,
        lighting: quads[i][4],
        smoothLighting: quads[i][5]
      })
    }

    return meshes
  }

  function combineMeshes(meshes) {
    if (!meshes || meshes.length === 0) return null

    let finalGeometry,
      materials = [],
      mergedGeometry = new THREE.Geometry()

    const matrix = new THREE.Matrix4()

    for (let i = 0; i < meshes.length; i++) {
      const { geo, pos, mat, lighting, smoothLighting } = meshes[i]

      matrix.makeTranslation(pos[0], pos[1], pos[2])

      mergedGeometry.merge(getGeoWLighting(geo, lighting, smoothLighting), matrix, i)

      materials.push(mat)
    }

    finalGeometry = new THREE.BufferGeometry().fromGeometry(mergedGeometry)

    return { geo: finalGeometry.toJSON(), materials }
  }
}
