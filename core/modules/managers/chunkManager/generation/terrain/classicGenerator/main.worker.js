/* eslint-disable no-unused-vars, no-undef, no-restricted-globals, eslint-disable-line  */

export default () => {
  self.addEventListener('message', e => {
    if (!e) return

    const { cmd } = e.data
    if (!cmd) throw new Error('Command not specified.')

    switch (cmd) {
      case 'BOOT': {
        const { config } = e.data
        self.config = config

        self.generator = new ClassicGenerator(config.seed, config.size)
        self.generator.registerCB(config.changedBlocks)

        const { size, stride } = config

        /* -------------------------------------------------------------------------- */
        /*                          NDARRAY HELPER FUNCTIONS                          */
        /* -------------------------------------------------------------------------- */
        self.set = (data, i, j, k, v) => (data[i * stride[0] + j * stride[1] + k * stride[2]] = v)
        self.get = (data, i, j, k) => data[i * stride[0] + j * stride[1] + k * stride[2]]

        self.setLighting = (lighting, i, j, k, l, v) =>
          (lighting[i * size ** 2 * 6 + j * size * 6 + k * 6 + l] = v)
        self.getLighting = (lighting, i, j, k, l) =>
          lighting[i * size ** 2 * 6 + j * size * 6 + k * 6 + l]

        self.setSmoothLighting = (smoothLighting, i, j, k, l, m, n, v) =>
          (smoothLighting[
            i * size ** 2 * 6 * 3 * 3 + j * size * 6 * 3 * 3 + k * 6 * 3 * 3 + l * 3 * 3 + m * 3 + n
          ] = v)
        self.getSmoothLighting = (smoothLighting, i, j, k, l, m, n) =>
          smoothLighting[
            i * size ** 2 * 6 * 3 * 3 + j * size * 6 * 3 * 3 + k * 6 * 3 * 3 + l * 3 * 3 + m * 3 + n
          ]
        self.getSmoothLightingSide = (smoothLighting, i, j, k, l) => {
          if (self.getSmoothLighting(smoothLighting, i, j, k, l, 0, 0) === 0) return null
          const output = new Array(3)
          for (let m = 0; m < 3; m++) {
            output[m] = new Uint8Array(3)
            for (let n = 0; n < 3; n++) {
              output[m][n] = self.getSmoothLighting(smoothLighting, i, j, k, l, m, n)
            }
          }
          return output
        }

        postMessage({ cmd })
        break
      }

      case 'GET_HIGHEST': {
        const { x, z } = e.data

        const height = self.generator.getHighestBlock(x, z)

        postMessage({
          cmd,
          h: height
        })

        break
      }

      case 'GET_CHUNK': {
        const {
          chunkRep,
          coords: { coordx, coordy, coordz }
        } = e.data
        const { size, neighborWidth } = self.config

        const blocks = new Uint8Array((size + neighborWidth * 2) ** 3)
        const lighting = new Uint8Array(size ** 3 * 6)
        const smoothLighting = new Uint8Array(size ** 3 * 6 * 3 * 3)

        self.generator.setVoxelData(blocks, coordx, coordy, coordz)
        self.generator.setLightingData(lighting, smoothLighting, blocks, coordx, coordy, coordz)

        /** MESHING RIGHT BELOW */
        const dims = [size + neighborWidth * 2, size + neighborWidth * 2, size + neighborWidth * 2]

        if (blocks.find(ele => ele)) {
          const planes = calcPlanes(blocks, lighting, smoothLighting, dims, coordx, coordy, coordz)

          postMessage({ cmd, blocks, planes, chunkRep })
        } else postMessage({ cmd, blocks, planes: [], chunkRep })

        break
      }

      case 'UPDATE_BLOCK': {
        const { data, block, chunkRep } = e.data
        const { size, stride } = self.config

        if (data.find(ele => ele)) {
          const dims = [size + 2, size + 2, size + 2]
          const get = (i, j, k) => data[i * stride[0] + j * stride[1] + k * stride[2]]

          const quads = calcPlanes(get, dims)

          postMessage({ cmd, quads, block, chunkRep })
        } else postMessage({ cmd, quads: [], block, chunkRep })

        break
      }
      default:
        break
    }
  })
}
