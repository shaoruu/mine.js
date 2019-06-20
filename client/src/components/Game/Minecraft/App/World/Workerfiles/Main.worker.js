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

        postMessage({ cmd })
        break
      case 'GET_HIGHEST': {
        const { x, z } = e.data

        postMessage({ cmd, h: self.generator.getHighestBlock(x, z) })

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

        self.generator.setVoxelData(set, coordx, coordy, coordz, changedBlocks)
        /** MESHING RIGHT BELOW */
        const dims = [size + 2, size + 2, size + 2]

        if (blocks.find(ele => ele)) {
          const quads = calcQuads(get, dims)

          postMessage({ cmd, blocks, quads, chunkName })
        } else postMessage({ cmd, blocks, quads: [], chunkName })

        const quads = calcQuads(get, dims)

        postMessage({ cmd, blocks, quads, chunkName })
        break
      }
      case 'UPDATE_BLOCK': {
        const { data, block, chunkName } = e.data
        const { size, stride } = self.config

        if (data.find(ele => ele)) {
          const dims = [size + 2, size + 2, size + 2]
          const get = (i, j, k) =>
            data[i * stride[0] + j * stride[1] + k * stride[2]]

          const quads = calcQuads(get, dims)

          postMessage({ cmd, quads, block, chunkName })
        } else postMessage({ cmd, quads: [], block, chunkName })

        break
      }
      default:
        break
    }
  })
}
