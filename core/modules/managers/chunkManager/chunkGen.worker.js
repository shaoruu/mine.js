import { ClassicGenerator } from '../../../lib/generation/terrain'
import Config from '../../../config/config'

import Mesher from './mesher'

import ndarray from 'ndarray'

const SIZE = Config.chunk.size
const NEIGHBOR_WIDTH = Config.chunk.neighborWidth

self.onmessage = function(e) {
  if (!e) return

  const { cmd } = e.data
  if (!cmd) throw new Error('Command not specified.')

  switch (cmd) {
    case 'BOOT': {
      const { seed, changedBlocks } = e.data.config

      self.generator = new ClassicGenerator(seed)
      self.generator.registerCB(changedBlocks)

      self.postMessage({ cmd })

      break
    }

    case 'GET_HIGHEST': {
      const { x, z } = e.data

      const height = self.generator.getHighestBlock(x, z)

      self.postMessage({
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

      const blocks = ndarray(new Uint8Array((SIZE + NEIGHBOR_WIDTH * 2) ** 3), [
        SIZE + NEIGHBOR_WIDTH * 2,
        SIZE + NEIGHBOR_WIDTH * 2,
        SIZE + NEIGHBOR_WIDTH * 2
      ])

      const lighting = ndarray(new Uint8Array(SIZE ** 3 * 6), [SIZE, SIZE, SIZE, 6])

      const smoothLighting = ndarray(new Uint8Array(SIZE ** 3 * 6 * 3 * 3), [
        SIZE,
        SIZE,
        SIZE,
        6,
        3,
        3
      ])

      self.generator.setVoxelData(blocks, coordx, coordy, coordz)
      self.generator.setLightingData(lighting, smoothLighting, blocks, coordx, coordy, coordz)

      const dims = [SIZE + NEIGHBOR_WIDTH * 2, SIZE + NEIGHBOR_WIDTH * 2, SIZE + NEIGHBOR_WIDTH * 2]

      if (blocks.data.find(ele => ele)) {
        const planes = Mesher.calcPlanes(
          blocks,
          lighting,
          smoothLighting,
          dims,
          coordx,
          coordy,
          coordz
        )

        self.postMessage({ cmd, blocks: blocks.data, planes, chunkRep })
      } else self.postMessage({ cmd, blocks, planes: [], chunkRep })

      break
    }

    default:
      break
  }
}
