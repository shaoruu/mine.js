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

        const { stride } = config

        self.set = (data, i, j, k, v) => (data[i * stride[0] + j * stride[1] + k * stride[2]] = v)
        self.get = (data, i, j, k) => data[i * stride[0] + j * stride[1] + k * stride[2]]

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
        const { size } = self.config

        const blocks = new Uint8Array((size + 2) * (size + 2) * (size + 2))

        self.generator.setVoxelData(blocks, coordx, coordy, coordz)
        /** MESHING RIGHT BELOW */
        const dims = [size + 2, size + 2, size + 2]

        if (blocks.find(ele => ele)) {
          const planes = calcPlanes(blocks, dims, coordx, coordy, coordz)

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
