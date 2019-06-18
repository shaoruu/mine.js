export default () => {
  /* eslint-disable no-restricted-globals, eslint-disable-line */

  /**
   * IMPORTING FILES
   */
  /* eslint-disable no-undef */
  importScripts('https://unpkg.com/noisejs')

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

  /**
   * FUNCTIONAL CLASS DECLARATIONS FOR WORKER-SCOPE
   */
  function Generator(seed, size, config = {}) {
    const {
      octaves = 7,
      amplitude = 70,
      smoothness = 235,
      heightOffset = -5,
      roughness = 0.53
    } = config

    const initSeed = seed => {
      let hash = 0,
        chr
      if (seed.length === 0) return hash

      for (let i = 0; i < seed.length; i++) {
        chr = seed.charCodeAt(i)
        hash = (hash << 5) - hash + chr
        hash |= 0
      }

      if (hash > 0 && hash < 1) hash *= 65536

      hash = Math.floor(hash)

      this.noise = new Noise(hash)
    }

    initSeed(seed)

    this.getHeight = (x, z) => {
      let totalValue = 0.0

      for (let i = 0; i < octaves - 1; i++) {
        const freq = 2 ** i,
          amp = roughness ** i

        totalValue +=
          this.noise.perlin2((x * freq) / smoothness, (z * freq) / smoothness) *
          amp
      }

      const val = (totalValue / 2.1 + 1.2) * amplitude + heightOffset
      return val > 0 ? val : 1
    }

    this.setBlocks = (set, heightMap, offsets, changedBlocks) => {
      for (let y = 0; y < size + 2; y++) {
        for (let x = 0; x < size + 2; x++) {
          for (let z = 0; z < size + 2; z++) {
            const height = heightMap[x][z],
              actualY = offsets[1] + y,
              cb =
                changedBlocks[
                  getCoordsRepresentation(
                    offsets[0] + x,
                    actualY,
                    offsets[2] + z
                  )
                ]
            let value = 0

            if (typeof cb === 'number') {
              value = cb
            } else if (actualY === height) {
              value = 2
            } else if (actualY > height - 3 && actualY <= height - 1) {
              value = 3
            } else if (actualY < height) {
              value = 1
            }

            set(x, z, y, value)
          }
        }
      }
    }

    this.setVoxelData = (set, coordx, coordy, coordz, changedBlocks) => {
      const heightMap = new Array(size + 2)
      for (let i = 0; i < size + 2; i++) heightMap[i] = new Array(size + 2)

      const offsets = [coordx * size - 1, coordy * size - 1, coordz * size - 1]

      for (let x = 0; x < size + 2; x++)
        for (let z = 0; z < size + 2; z++) {
          const posx = offsets[0] + x,
            posz = offsets[2] + z

          const h = this.getHeight(posx, posz)
          heightMap[x][z] = Math.floor(h)
        }

      this.setBlocks(set, heightMap, offsets, changedBlocks)
    }
  }

  self.addEventListener('message', e => {
    if (!e) return

    const { cmd } = e.data
    if (!cmd) throw new Error('Command not specified.')

    switch (cmd) {
      case 'BOOT':
        const { config } = e.data
        self.config = config

        postMessage({ cmd })
        break
      case 'GET_HIGHEST': {
        const { x, z } = e.data
        const { seed, size } = self.config

        const tempGen = new Generator(seed, size)
        postMessage({ cmd, h: tempGen.getHeight(x, z) })

        break
      }
      case 'GET_CHUNK': {
        const {
          changedBlocks,
          chunkName,
          coords: { coordx, coordy, coordz }
        } = e.data
        const { seed, size, stride } = self.config

        const generator = new Generator(seed, size)
        const blocks = new Uint16Array((size + 2) * (size + 2) * (size + 2))

        const set = (i, j, k, v) =>
          (blocks[i * stride[0] + j * stride[1] + k * stride[2]] = v)
        const get = (i, j, k) =>
          blocks[i * stride[0] + j * stride[1] + k * stride[2]]

        generator.setVoxelData(set, coordx, coordy, coordz, changedBlocks)
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
  /* eslint-enable no-restricted-globals, eslint-disable-line */
}
