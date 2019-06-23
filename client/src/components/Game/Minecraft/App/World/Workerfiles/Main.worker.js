/* eslint-disable no-unused-vars, no-undef, no-restricted-globals, eslint-disable-line  */

export default () => {
  self.addEventListener('message', e => {
    if (!e) return

    const { cmd } = e.data
    if (!cmd) throw new Error('Command not specified.')

    switch (cmd) {
      case 'BOOT':
        const { config } = e.data
        self.config = config

        self.generator = new Generator(config.seed, config.size)
        self.generator.registerCB(config.changedBlocks)

        postMessage({ cmd })
        break
      case 'GET_HIGHEST': {
        const { x, z } = e.data

        postMessage({ cmd, h: self.generator.getRelativeHighest(x, z) })

        break
      }
      case 'GET_CHUNK': {
        const {
          changedBlocks,
          chunkName,
          coords: { coordx, coordy, coordz }
        } = e.data
        const { size, stride } = self.config

        const blocks = new Uint16Array((size + 2) * (size + 2) * (size + 2))

        const set = (i, j, k, v) =>
          (blocks[i * stride[0] + j * stride[1] + k * stride[2]] = v)
        const get = (i, j, k) =>
          blocks[i * stride[0] + j * stride[1] + k * stride[2]]

        const lighting = new Uint16Array(size ** 3 * 6)

        const setLighting = (i, j, k, l, v) =>
          (lighting[i * size ** 2 * 6 + j * size * 6 + k * 6 + l] = v)
        const getLighting = (i, j, k, l) =>
          lighting[i * size ** 2 * 6 + j * size * 6 + k * 6 + l]

        const smoothLighting = new Uint16Array(size ** 3 * 6 * 3 * 3)

        const setSmoothLighting = (i, j, k, l, m, n, v) =>
          (smoothLighting[
            i * size ** 2 * 6 * 3 * 3 +
            j * size * 6 * 3 * 3 +
            k * 6 * 3 * 3 +
            l * 3 * 3 +
            m * 3 +
            n
          ] = v)
        const getSmoothLighting = (i, j, k, l, m, n) =>
          smoothLighting[
          i * size ** 2 * 6 * 3 * 3 +
          j * size * 6 * 3 * 3 +
          k * 6 * 3 * 3 +
          l * 3 * 3 +
          m * 3 +
          n
          ]
        const getSmoothLightingSide = (i, j, k, l) => {
          if (getSmoothLighting(i, j, k, l, 0, 0) === 0) {
            return null
          }
          const output = new Array(3)
          for (let m = 0; m < 3; m++) {
            output[m] = new Uint16Array(3)
            for (let n = 0; n < 3; n++) {
              output[m][n] = getSmoothLighting(i, j, k, l, m, n)
            }
          }
          return output
        }

        self.generator.setVoxelData(set, coordx, coordy, coordz, changedBlocks)

        self.generator.setLightingData(
          setLighting,
          setSmoothLighting,
          get,
          coordx,
          coordy,
          coordz,
          changedBlocks
        )
        /** MESHING RIGHT BELOW */
        const dims = [size + 2, size + 2, size + 2]

        if (blocks.find(ele => ele)) {
          const quads = calcQuads(get, getLighting, getSmoothLightingSide, dims)

          postMessage({ cmd, blocks, lighting, smoothLighting, quads, chunkName })
        } else postMessage({ cmd, blocks, lighting, smoothLighting, quads: [], chunkName })

        const quads = calcQuads(get, getLighting, getSmoothLightingSide, dims)

        postMessage({ cmd, blocks, lighting, smoothLighting, quads, chunkName })
        break
      }
      case 'UPDATE_BLOCK': {
        const { data, lighting, smoothLighting, block, type, chunkName } = e.data
        const { size, stride } = self.config

        if (data.find(ele => ele)) {
          const dims = [size + 2, size + 2, size + 2]
          const set = (i, j, k, v) =>
            (data[i * stride[0] + j * stride[1] + k * stride[2]] = v)
          const get = (i, j, k) =>
            data[i * stride[0] + j * stride[1] + k * stride[2]]

          const setLighting = (i, j, k, l, v) =>
            (lighting[i * size ** 2 * 6 + j * size * 6 + k * 6 + l] = v)
          const getLighting = (i, j, k, l) =>
            lighting[i * size ** 2 * 6 + j * size * 6 + k * 6 + l]

          const setSmoothLighting = (i, j, k, l, m, n, v) =>
            (smoothLighting[
              i * size ** 2 * 6 * 3 * 3 +
              j * size * 6 * 3 * 3 +
              k * 6 * 3 * 3 +
              l * 3 * 3 +
              m * 3 +
              n
            ] = v)
          const getSmoothLighting = (i, j, k, l, m, n) =>
            smoothLighting[
            i * size ** 2 * 6 * 3 * 3 +
            j * size * 6 * 3 * 3 +
            k * 6 * 3 * 3 +
            l * 3 * 3 +
            m * 3 +
            n
            ]
          const getSmoothLightingSide = (i, j, k, l) => {
            if (getSmoothLighting(i, j, k, l, 0, 0) === 0) {
              return null
            }
            const output = new Array(3)
            for (let m = 0; m < 3; m++) {
              output[m] = new Uint16Array(3)
              for (let n = 0; n < 3; n++) {
                output[m][n] = getSmoothLighting(i, j, k, l, m, n)
              }
            }
            return output
          }

          const { x, y, z } = block;
          set(x + 1, z + 1, y + 1, type);

          const surroundings = [
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: -1, y: 0, z: 0 },
            { x: 0, y: 0, z: -1 },
            { x: 0, y: -1, z: 0 }
          ];

          const oppositeSIndex = [5, 3, 4, 1, 2, 0]

          const lightingSides = []

          for (let s = 0; s < surroundings.length; s++) {
            const sur = surroundings[s]
            if (x + sur.x >= 0 && x + sur.x < size && y + sur.y >= 0 && y + sur.y < size && z + sur.z >= 0 && z + sur.z < size) {
              setLighting(x + sur.x, z + sur.z, y + sur.y, s, 15)
              lightingSides.push({ x: x + sur.x, z: z + sur.z, y: y + sur.y, s, val: 15 })
            }
          }

          const smoothLightingVals = []

          for (let x1 = x - 1; x1 <= x + 1; x1++)
            for (let y1 = y - 1; y1 <= y + 1; y1++)
              for (let z1 = z - 1; z1 <= z + 1; z1++) {
                if (x1 >= 0 && x1 < size && y1 >= 0 && y1 < size && z1 >= 0 && z1 < size) {
                  const smoothLighting = self.generator.getBlockSmoothLighting(x1 + 1, y1 + 1, z1 + 1, get)
                  for (let l = 0; l < 6; l++) {
                    if (smoothLighting[l]) {
                      for (let m = 0; m < 3; m++)
                        for (let n = 0; n < 3; n++) {
                          setSmoothLighting(x1, z1, y1, l, m, n, smoothLighting[l][m][n])
                          smoothLightingVals.push({ x: x1, z: z1, y: y1, s: l, f: m, c: n, val: smoothLighting[l][m][n] })
                        }
                    }
                  }
                }
              }

          const quads = calcQuads(get, getLighting, getSmoothLightingSide, dims)

          postMessage({ cmd, quads, block, lightingSides, smoothLightingVals, chunkName })
        } else postMessage({ cmd, quads: [], block, lightingSides, smoothLightingVals, chunkName })

        break
      }
      default:
        break
    }
  })
}
