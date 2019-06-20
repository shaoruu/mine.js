/* eslint-disable no-unused-vars, no-undef, no-restricted-globals, eslint-disable-line  */

export default () => {
  /**
   * FUNCTIONAL CLASS DECLARATIONS FOR WORKER-SCOPE
   */
  function Generator(seed, size) {
    const {
      maxWorldHeight = 256,
      waterLevel = 62,
      scale = 1,
      octaves = 2,
      persistance = 0.5,
      lacunarity = 2,
      heightOffset = 2.5,
      amplifier = 1
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

    const isSolidAt = (x, y, z) =>
      getNoise((x * scale) / 100, (y * scale) / 100, (z * scale) / 100) >= -0.2

    initSeed(seed)
    initNoises()

    this.getHighestBlock = (x, z) => {
      for (let y = maxWorldHeight; y >= 0; y--) {
        const isSolid = isSolidAt(x, y, z)

        if (isSolid) return y + 1
      }
      return 0
    }

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
              tempz = offsets[2] + z,
              cb = changedBlocks[getCoordsRepresentation(tempx, tempy, tempz)]

            if (typeof cb === 'number') {
              set(x, z, y, cb)
              continue
            }

            if (tempy > maxWorldHeight || tempy <= 0) blockId = 0
            else {
              const isSolid = isSolidAt(tempx, tempy, tempz)

              if (isSolid) {
                blockId = 57
              } else if (tempy <= waterLevel) {
                blockId = 1
              }
            }

            set(x, z, y, blockId)
          }
        }
      }
    }
  }
}
