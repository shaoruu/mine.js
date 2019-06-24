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

        const { stride, size } = config

        self.set = (data, i, j, k, v) =>
          (data[i * stride[0] + j * stride[1] + k * stride[2]] = v)
        self.get = (data, i, j, k) => data[i * stride[0] + j * stride[1] + k * stride[2]]

        self.setLighting = (lighting, i, j, k, l, v) =>
          (lighting[i * size ** 2 * 6 + j * size * 6 + k * 6 + l] = v)
        self.getLighting = (lighting, i, j, k, l) =>
          lighting[i * size ** 2 * 6 + j * size * 6 + k * 6 + l]

        self.setSmoothLighting = (smoothLighting, i, j, k, l, m, n, v) =>
          (smoothLighting[
            i * size ** 2 * 6 * 3 * 3 +
              j * size * 6 * 3 * 3 +
              k * 6 * 3 * 3 +
              l * 3 * 3 +
              m * 3 +
              n
          ] = v)
        self.getSmoothLighting = (smoothLighting, i, j, k, l, m, n) =>
          smoothLighting[
            i * size ** 2 * 6 * 3 * 3 +
              j * size * 6 * 3 * 3 +
              k * 6 * 3 * 3 +
              l * 3 * 3 +
              m * 3 +
              n
          ]
        self.getSmoothLightingSide = (smoothLighting, i, j, k, l) => {
          if (self.getSmoothLighting(smoothLighting, i, j, k, l, 0, 0) === 0) {
            return null
          }
          const output = new Array(3)
          for (let m = 0; m < 3; m++) {
            output[m] = new Uint16Array(3)
            for (let n = 0; n < 3; n++) {
              output[m][n] = self.getSmoothLighting(smoothLighting, i, j, k, l, m, n)
            }
          }
          return output
        }

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
        const { size } = self.config

        const blocks = new Uint16Array((size + 2) * (size + 2) * (size + 2))
        const lighting = new Uint16Array(size ** 3 * 6)
        const smoothLighting = new Uint16Array(size ** 3 * 6 * 3 * 3)

        self.generator.setVoxelData(blocks, coordx, coordy, coordz, changedBlocks)

        self.generator.setLightingData(
          lighting,
          smoothLighting,
          blocks,
          coordx,
          coordy,
          coordz
        )
        /** MESHING RIGHT BELOW */
        const dims = [size + 2, size + 2, size + 2]

        if (blocks.find(ele => ele)) {
          const quads = calcQuads(blocks, lighting, smoothLighting, dims)

          postMessage({
            cmd,
            blocks,
            lighting,
            smoothLighting,
            quads,
            chunkName
          })
        } else
          postMessage({
            cmd,
            blocks,
            lighting,
            smoothLighting,
            quads: [],
            chunkName
          })

        const quads = calcQuads(blocks, lighting, smoothLighting, dims)

        postMessage({ cmd, blocks, lighting, smoothLighting, quads, chunkName })
        break
      }
      case 'UPDATE_BLOCK': {
        const {
          data,
          lighting,
          smoothLighting,
          block,
          chunkName,
          coords: { coordx, coordy, coordz }
        } = e.data
        const { size } = self.config

        if (data.find(ele => ele)) {
          const dims = [size + 2, size + 2, size + 2]

          self.generator.setLightingData(
            lighting,
            smoothLighting,
            data,
            coordx,
            coordy,
            coordz
          )

          const quads = calcQuads(data, lighting, smoothLighting, dims)

          postMessage({
            cmd,
            quads,
            block,
            lighting,
            smoothLighting,
            chunkName
          })
        } else
          postMessage({
            cmd,
            quads: [],
            block,
            lighting,
            smoothLighting,
            chunkName
          })

        break
      }
      case 'APPEND_CB': {
        const { changedBlock } = e.data
        self.generator.appendCB(changedBlock)

        break
      }
      default:
        break
    }
  })
}
