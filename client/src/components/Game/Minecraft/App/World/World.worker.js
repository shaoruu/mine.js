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
  function Generator(seed, size) {
    const {
      maxWorldHeight = 256,
      waterLevel = 62,
      scale = 1,
      octaves = 5,
      persistance = 0.5,
      lacunarity = 2,
      heightOffset = 2.5,
      amplifier = 4
    } = {}

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

      this.seed = hash
    }

    const initNoises = () => {
      this.noise = new Noise(this.seed)

      // BIOMES
      this.rainfall = new Noise(this.seed * 2)
      this.temp = new Noise(this.seed / 2)
    }

    const getNoise = (x, y, z) => this.octavePerlin3(x, y, z) - (y * 4) / scale

    const isSolidAt = (x, y, z) => getNoise(x, y, z) >= -0.2

    initSeed(seed)
    initNoises()

    this.getHighestBlock = (x, z) => {}

    this.octavePerlin3 = (x, y, z) => {
      let total = 0,
        frequency = 1,
        amplitude = 1,
        maxVal = 0

      for (let i = 0; i < octaves; i++) {
        total +=
          this.noise.perlin3(
            x * frequency * scale,
            y * frequency * scale,
            z * frequency * scale
          ) * amplitude

        maxVal += amplitude

        amplitude *= persistance
        frequency *= lacunarity
      }

      return (total / maxVal) * amplifier + heightOffset
    }

    this.setVoxelData = (set, coordx, coordy, coordz, changedBlocks) => {
      const offsets = [coordx * size - 1, coordy * size - 1, coordz * size - 1]

      for (let x = 0; x < size + 2; x++) {
        for (let z = 0; z < size + 2; z++) {
          for (let y = 0; y < size + 2; y++) {
            let blockId

            const tempx = offsets[0] + x,
              tempy = offsets[1] + y,
              tempz = offsets[2] + z

            if (tempy > maxWorldHeight) blockId = 0
            else if (tempy <= waterLevel) blockId = 1
            else {
              const x2 = (tempx * scale) / 100
              const y2 = (tempy * scale) / 100
              const z2 = (tempz * scale) / 100

              const isSolid = isSolidAt(x2, y2, z2)

              if (isSolid) {
                blockId = 57
              }
            }

            set(x, z, y, blockId)
          }
        }
      }
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
  /* eslint-enable no-restricted-globals, eslint-disable-line */
}
