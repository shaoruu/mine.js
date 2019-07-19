/* eslint-disable no-unused-vars, no-undef, no-restricted-globals, eslint-disable-line  */

export default () => {
  function ClassicGenerator(seed) {
    const {
      size: SIZE,
      block: { liquid: LIQUID_BLOCKS },
      world: {
        waterLevel,
        maxWorldHeight,
        generation: {
          classicGeneration: { swampland }
        }
      }
    } = self.config

    const {
      constants: { scale, octaves, persistance, lacunarity, heightOffset, amplifier },
      types: { top, underTop, beach }
    } = swampland

    const initSeed = s => {
      let hash = 0
      let chr
      if (s.length === 0) return hash

      for (let i = 0; i < s.length; i++) {
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

    const isSolidAt = (x, y, z, arr = undefined) => {
      if (arr) {
        const arrVal = self.get(arr, (x % SIZE) + 1, (z % SIZE) + 1, (y % SIZE) + 1)
        if (arrVal) return !LIQUID_BLOCKS.includes(arrVal)
      }
      return getNoise((x * scale) / 100, (y * scale) / 100, (z * scale) / 100) >= -0.2
    }

    const isSolidAtWithCB = (x, y, z) => {
      const cb = this.changedBlocks[get3DCoordsRep(x, y, z)]
      if (cb) return !!cb
      return isSolidAt(x, y, z)
    }

    // const isTopBlock = (x, y, z) => {
    //   if (!isSolidAtWithCB(x, y + 1, z)) return true
    //   return false
    // }

    initSeed(seed)
    initNoises()

    this.getNaiveHighestBlock = (x, z) => {
      for (let y = maxWorldHeight; y >= 0; y--) {
        const isSolid = isSolidAt(x, y, z)

        if (isSolid) return y
      }
      return 0
    }

    this.getHighestBlock = (x, z) => {
      let high = maxWorldHeight
      let low = waterLevel
      let middle = Math.floor((high + low) / 2)

      while (low <= high) {
        if (
          isSolidAtWithCB(x, middle, z) &&
          !isSolidAtWithCB(x, middle + 1, z) &&
          !isSolidAtWithCB(x, middle + 2, z)
        )
          break
        else if (!isSolidAtWithCB(x, middle, z)) high = middle - 1
        else low = middle + 2

        middle = Math.floor((high + low) / 2)
      }

      return middle
    }

    this.octavePerlin3 = (x, y, z) => {
      let total = 0
      let frequency = 1
      let amplitude = 1
      let maxVal = 0

      for (let i = 0; i < octaves; i++) {
        total +=
          this.noise.perlin3(x * frequency * scale, y * frequency * scale, z * frequency * scale) *
          amplitude

        maxVal += amplitude

        amplitude *= persistance
        frequency *= lacunarity
      }

      return (total / maxVal) * amplifier + heightOffset
    }

    this.registerCB = (changedBlocks = {}) => (this.changedBlocks = changedBlocks)

    this.getBlockInfo = (x, y, z, maxHeight, arr) => {
      let blockId = 0
      const cb = this.changedBlocks[get3DCoordsRep(x, y, z)]

      if (typeof cb === 'number') return cb

      if (y > maxWorldHeight || y <= 0) blockId = 0
      else {
        const isSolid = isSolidAt(x, y, z)

        if (isSolid) {
          if (
            y === waterLevel &&
            (!isSolidAt(x + 1, y, z) ||
              !isSolidAt(x - 1, y, z, arr) ||
              !isSolidAt(x, y, z + 1) ||
              !isSolidAt(x, y, z - 1, arr))
          )
            blockId = beach
          else if (y === maxHeight) {
            if (y < waterLevel) blockId = underTop
            else blockId = top
          } else if (y >= maxHeight - 3 && y < maxHeight) blockId = underTop
          else blockId = 1
        } else if (y <= waterLevel) blockId = 9
      }

      return blockId
    }

    this.setVoxelData = (arr, coordx, coordy, coordz) => {
      const offsets = [coordx * SIZE - 1, coordy * SIZE - 1, coordz * SIZE - 1]

      for (let x = offsets[0]; x < offsets[0] + SIZE + 2; x++)
        for (let z = offsets[2]; z < offsets[2] + SIZE + 2; z++) {
          const maxHeight = this.getHighestBlock(x, z)
          for (let y = offsets[1]; y < offsets[1] + SIZE + 2; y++) {
            const blockType = this.getBlockInfo(x, y, z, maxHeight, arr)
            self.set(arr, x - offsets[0], z - offsets[2], y - offsets[1], blockType)
          }
        }
    }
  }
}
