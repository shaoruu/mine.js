/* eslint-disable no-unused-vars, no-undef, no-restricted-globals, eslint-disable-line  */

export default () => {
  /**
   * FUNCTIONAL CLASS DECLARATIONS FOR WORKER-SCOPE
   */
  function Generator(seed, size) {
    /**
     * Scale: number that determines at what distance to view the noise map.
     * Octaves: the number of levels of detail you want you perlin noise to have.
     * Persistence: how much each octave contributes to the overall shape (adjusts amplitude).
     * Lacunarity: determines how much detail is added or removed at each octave (adjusts frequency).
     */

    const {
      maxWorldHeight = 256,
      waterLevel = 62,
      scale = 2,
      octaves = 10,
      persistance = 1,
      lacunarity = 1,
      heightOffset = 2.5,
      amplifier = 1
    } = {}

    // const {
    //   maxWorldHeight = 256,
    //   waterLevel = 62,
    //   scale = 2,
    //   octaves = 10,
    //   persistance = 1,
    //   lacunarity = 1,
    //   heightOffset = 2.5,
    //   amplifier = 1
    // } = {}

    // SOME GOOD CONFIGS
    // const {
    //   maxWorldHeight = 256,
    //   waterLevel = 62,
    //   scale = 1,
    //   octaves = 3,
    //   persistance = 0.5,
    //   lacunarity = 2,
    //   heightOffset = 2.5,
    //   amplifier = 1
    // } = {}

    /* -------------------------------------------------------------------------- */
    /*                             Internal Functions                             */
    /* -------------------------------------------------------------------------- */
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

    const isSolidAtWithCB = (x, y, z) => {
      const cb = this.changedBlocks[getCoordsRepresentation(x, y, z)]
      if (typeof cb === 'number') return !!cb
      return isSolidAt(x, y, z)
    }

    const isTopBlock = (x, y, z) => {
      if (!isSolidAtWithCB(x, y + 1, z)) return true
      return false
    }

    const getRelativeCoords = (x, y, z, offsets) => [x - offsets[0], y - offsets[1], z - offsets[2]]

    const getAbsoluteCoords = (x, y, z, offsets) => [x + offsets[0], y + offsets[1], z + offsets[2]]

    const checkWithinChunk = (x, y, z) =>
      x >= 0 && x < size + 2 && y >= 0 && y < size + 2 && z >= 0 && z < size + 2

    /* -------------------------------------------------------------------------- */
    /*                         Instance Initializing Calls                        */
    /* -------------------------------------------------------------------------- */
    initSeed(seed)
    initNoises()

    /* -------------------------------------------------------------------------- */
    /*                              Public Functions                              */
    /* -------------------------------------------------------------------------- */
    this.getRelativeHighest = (x, z) => {
      let high = maxWorldHeight,
        low = waterLevel,
        middle = Math.floor((high + low) / 2)

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

    this.getHighestBlock = (x, z) => {
      for (let y = maxWorldHeight; y >= 0; y--) {
        const isSolid = isSolidAtWithCB(x, y, z)
        if (isSolid) return y
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
          this.noise.perlin3(x * frequency * scale, y * frequency * scale, z * frequency * scale) *
          amplitude

        maxVal += amplitude

        amplitude *= persistance
        frequency *= lacunarity
      }

      return (total / maxVal) * amplifier + heightOffset
    }

    this.setVoxelData = (voxelData, coordx, coordy, coordz) => {
      const offsets = [coordx * size - 1, coordy * size - 1, coordz * size - 1]

      for (let x = 0; x < size + 2; x++) {
        for (let z = 0; z < size + 2; z++) {
          const maxHeight = this.getRelativeHighest(x + offsets[0], z + offsets[2])
          for (let y = 0; y < size + 2; y++) {
            const tempCoords = getAbsoluteCoords(x, y, z, offsets)

            const tempx = tempCoords[0],
              tempy = tempCoords[1],
              tempz = tempCoords[2],
              blockId = this.getBlockInfo(tempx, tempy, tempz, maxHeight)

            self.set(voxelData, x, z, y, blockId)
          }
        }
      }
    }

    this.setLightingData = (
      lightingData,
      smoothLightingData,
      voxelData,
      coordx,
      coordy,
      coordz
    ) => {
      const offsets = [coordx * size - 1, coordy * size - 1, coordz * size - 1]

      for (let x = 1; x < size + 1; x++)
        for (let z = 1; z < size + 1; z++)
          for (let y = 1; y < size + 1; y++) {
            if (self.get(voxelData, x, z, y) !== 0) {
              const tempCoords = getAbsoluteCoords(x, y, z, offsets)

              const tempx = tempCoords[0],
                tempy = tempCoords[1],
                tempz = tempCoords[2]

              const lighting = this.getBlockLighting(tempx, tempy, tempz, voxelData, offsets)
              for (let l = 0; l < 6; l++) {
                self.setLighting(lightingData, x - 1, z - 1, y - 1, l, lighting[l])
              }

              const smoothLighting = this.getBlockSmoothLighting(x, y, z, voxelData)
              for (let l = 0; l < 6; l++) {
                if (smoothLighting[l]) {
                  for (let m = 0; m < 3; m++)
                    for (let n = 0; n < 3; n++) {
                      self.setSmoothLighting(
                        smoothLightingData,
                        x - 1,
                        z - 1,
                        y - 1,
                        l,
                        m,
                        n,
                        smoothLighting[l][m][n]
                      )
                    }
                }
              }
            }
          }
    }

    this.getBlockLighting = (x, y, z, voxelData, offsets) => {
      const surroundings = [
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 0, z: -1 },
        { x: 0, y: -1, z: 0 }
      ]

      const lights = new Uint16Array(surroundings.length)

      for (let i = 0; i < surroundings.length; i++) {
        const block = {
          x: x + surroundings[i].x,
          y: y + surroundings[i].y,
          z: z + surroundings[i].z,
          lightLevel: 15
        }
        const value = this.getLoadedBlocks(block.x, block.y, block.z, voxelData, offsets)
        if (value === 0) {
          const pastNodeCoords = [getCoordsRepresentation(block.x, -1, block.z)]
          const queue = [block]
          while (queue.length > 0) {
            const q = queue.splice(0, 1)[0]
            if (this.getHighestBlock(q.x, q.z) < q.y) {
              lights[i] = q.lightLevel
              break
            }
            for (let n = 1; n < surroundings.length - 1; n++) {
              const newNode = {
                x: q.x + surroundings[n].x,
                y: -1,
                z: q.z + surroundings[n].z,
                lightLevel: q.lightLevel - 1
              }
              if (
                pastNodeCoords.indexOf(getCoordsRepresentation(newNode.x, newNode.y, newNode.z)) !==
                -1
              ) {
                continue
              }
              if (newNode.lightLevel < 0) {
                continue
              }

              let yValue = q.y

              let startValue = 0

              let endValue = this.getLoadedBlocks(newNode.x, yValue, newNode.z, voxelData, offsets)

              while (startValue === 0 && endValue !== 0) {
                yValue += 1
                startValue = this.getLoadedBlocks(q.x, yValue, q.z, voxelData, offsets)
                endValue = this.getLoadedBlocks(newNode.x, yValue, newNode.z, voxelData, offsets)
              }

              if (startValue !== 0 || endValue !== 0) {
                continue
              }

              newNode.y = yValue

              queue.push(newNode)
              pastNodeCoords.push(getCoordsRepresentation(newNode.x, -1, newNode.z))
            }
          }
        }
      }
      return lights
    }

    this.getBlockSmoothLighting = (x, y, z, voxelData) => {
      const output = new Array(6)

      const light = 2
      const shadow = 1

      const nxnzny = self.get(voxelData, x - 1, z - 1, y - 1)
      const nzny = self.get(voxelData, x, z - 1, y - 1)
      const pxnzny = self.get(voxelData, x + 1, z - 1, y - 1)
      const nxny = self.get(voxelData, x - 1, z, y - 1)
      const ny = self.get(voxelData, x, z, y - 1)
      const pxny = self.get(voxelData, x + 1, z, y - 1)
      const nxpzny = self.get(voxelData, x - 1, z + 1, y - 1)
      const pzny = self.get(voxelData, x, z + 1, y - 1)
      const pxpzny = self.get(voxelData, x + 1, z + 1, y - 1)

      const nxnz = self.get(voxelData, x - 1, z - 1, y)
      const nz = self.get(voxelData, x, z - 1, y)
      const pxnz = self.get(voxelData, x + 1, z - 1, y)
      const nx = self.get(voxelData, x - 1, z, y)
      const px = self.get(voxelData, x + 1, z, y)
      const nxpz = self.get(voxelData, x - 1, z + 1, y)
      const pz = self.get(voxelData, x, z + 1, y)
      const pxpz = self.get(voxelData, x + 1, z + 1, y)

      const nxnzpy = self.get(voxelData, x - 1, z - 1, y + 1)
      const nzpy = self.get(voxelData, x, z - 1, y + 1)
      const pxnzpy = self.get(voxelData, x + 1, z - 1, y + 1)
      const nxpy = self.get(voxelData, x - 1, z, y + 1)
      const py = self.get(voxelData, x, z, y + 1)
      const pxpy = self.get(voxelData, x + 1, z, y + 1)
      const nxpzpy = self.get(voxelData, x - 1, z + 1, y + 1)
      const pzpy = self.get(voxelData, x, z + 1, y + 1)
      const pxpzpy = self.get(voxelData, x + 1, z + 1, y + 1)

      if (py === 0) {
        const a = nxpy !== 0 || nzpy !== 0 || nxnzpy !== 0 ? 0 : 1
        const b = nxpy !== 0 || pzpy !== 0 || nxpzpy !== 0 ? 0 : 1
        const c = pxpy !== 0 || pzpy !== 0 || pxpzpy !== 0 ? 0 : 1
        const d = pxpy !== 0 || nzpy !== 0 || pxnzpy !== 0 ? 0 : 1

        const e = nxnzpy !== 0 ? 0 : 1
        const f = nxpzpy !== 0 ? 0 : 1
        const g = pxpzpy !== 0 ? 0 : 1
        const h = pxnzpy !== 0 ? 0 : 1

        if (e + g > f + h) {
          const py2ColorsFace0 = new Uint16Array(3)
          py2ColorsFace0[0] = b === 0 ? shadow : light
          py2ColorsFace0[1] = c === 0 ? shadow : light
          py2ColorsFace0[2] = a === 0 ? shadow : light

          const py2ColorsFace1 = new Uint16Array(3)
          py2ColorsFace1[0] = c === 0 ? shadow : light
          py2ColorsFace1[1] = d === 0 ? shadow : light
          py2ColorsFace1[2] = a === 0 ? shadow : light

          output[0] = [py2ColorsFace0, py2ColorsFace1, [1, 1, 1]]
        } else {
          const pyColorsFace0 = new Uint16Array(3)
          pyColorsFace0[0] = a === 0 ? shadow : light
          pyColorsFace0[1] = b === 0 ? shadow : light
          pyColorsFace0[2] = d === 0 ? shadow : light

          const pyColorsFace1 = new Uint16Array(3)
          pyColorsFace1[0] = b === 0 ? shadow : light
          pyColorsFace1[1] = c === 0 ? shadow : light
          pyColorsFace1[2] = d === 0 ? shadow : light

          output[0] = [pyColorsFace0, pyColorsFace1, [0, 0, 0]]
        }
      }

      if (px === 0) {
        const a = pxny !== 0 || pxnz !== 0 || pxnzny !== 0 ? 0 : 1
        const b = pxny !== 0 || pxpz !== 0 || pxpzny !== 0 ? 0 : 1
        const c = pxpy !== 0 || pxpz !== 0 || pxpzpy !== 0 ? 0 : 1
        const d = pxpy !== 0 || pxnz !== 0 || pxnzpy !== 0 ? 0 : 1

        const e = pxnzny !== 0 ? 0 : 1
        const f = pxpzny !== 0 ? 0 : 1
        const g = pxpzpy !== 0 ? 0 : 1
        const h = pxnzpy !== 0 ? 0 : 1

        if (e + g > f + h) {
          const px2ColorsFace0 = new Uint16Array(3)
          px2ColorsFace0[0] = b === 0 ? shadow : light
          px2ColorsFace0[1] = a === 0 ? shadow : light
          px2ColorsFace0[2] = c === 0 ? shadow : light

          const px2ColorsFace1 = new Uint16Array(3)
          px2ColorsFace1[0] = a === 0 ? shadow : light
          px2ColorsFace1[1] = d === 0 ? shadow : light
          px2ColorsFace1[2] = c === 0 ? shadow : light

          output[1] = [px2ColorsFace0, px2ColorsFace1, [1, 1, 1]]
        } else {
          const pxColorsFace0 = new Uint16Array(3)
          pxColorsFace0[0] = c === 0 ? shadow : light
          pxColorsFace0[1] = b === 0 ? shadow : light
          pxColorsFace0[2] = d === 0 ? shadow : light

          const pxColorsFace1 = new Uint16Array(3)
          pxColorsFace1[0] = b === 0 ? shadow : light
          pxColorsFace1[1] = a === 0 ? shadow : light
          pxColorsFace1[2] = d === 0 ? shadow : light

          output[1] = [pxColorsFace0, pxColorsFace1, [0, 0, 0]]
        }
      }

      if (pz === 0) {
        const a = pzny !== 0 || nxpz !== 0 || nxpzny !== 0 ? 0 : 1
        const b = pzny !== 0 || pxpz !== 0 || pxpzny !== 0 ? 0 : 1
        const c = pzpy !== 0 || pxpz !== 0 || pxpzpy !== 0 ? 0 : 1
        const d = pzpy !== 0 || nxpz !== 0 || nxpzpy !== 0 ? 0 : 1

        const e = nxpzny !== 0 ? 0 : 1
        const f = pxpzny !== 0 ? 0 : 1
        const g = pxpzpy !== 0 ? 0 : 1
        const h = nxpzpy !== 0 ? 0 : 1

        if (e + g < f + h) {
          const pz2ColorsFace0 = new Uint16Array(3)
          pz2ColorsFace0[0] = a === 0 ? shadow : light
          pz2ColorsFace0[1] = b === 0 ? shadow : light
          pz2ColorsFace0[2] = d === 0 ? shadow : light

          const pz2ColorsFace1 = new Uint16Array(3)
          pz2ColorsFace1[0] = b === 0 ? shadow : light
          pz2ColorsFace1[1] = c === 0 ? shadow : light
          pz2ColorsFace1[2] = d === 0 ? shadow : light

          output[2] = [pz2ColorsFace0, pz2ColorsFace1, [1, 1, 1]]
        } else {
          const pzColorsFace0 = new Uint16Array(3)
          pzColorsFace0[0] = d === 0 ? shadow : light
          pzColorsFace0[1] = a === 0 ? shadow : light
          pzColorsFace0[2] = c === 0 ? shadow : light

          const pzColorsFace1 = new Uint16Array(3)
          pzColorsFace1[0] = a === 0 ? shadow : light
          pzColorsFace1[1] = b === 0 ? shadow : light
          pzColorsFace1[2] = c === 0 ? shadow : light

          output[2] = [pzColorsFace0, pzColorsFace1, [0, 0, 0]]
        }
      }
      if (nx === 0) {
        const a = nxny !== 0 || nxnz !== 0 || nxnzny !== 0 ? 0 : 1
        const b = nxny !== 0 || nxpz !== 0 || nxpzny !== 0 ? 0 : 1
        const c = nxpy !== 0 || nxpz !== 0 || nxpzpy !== 0 ? 0 : 1
        const d = nxpy !== 0 || nxnz !== 0 || nxnzpy !== 0 ? 0 : 1

        const e = nxnzny !== 0 ? 0 : 1
        const f = nxpzny !== 0 ? 0 : 1
        const g = nxpzpy !== 0 ? 0 : 1
        const h = nxnzpy !== 0 ? 0 : 1

        if (e + g > f + h) {
          const nx2ColorsFace0 = new Uint16Array(3)
          nx2ColorsFace0[0] = b === 0 ? shadow : light
          nx2ColorsFace0[1] = a === 0 ? shadow : light
          nx2ColorsFace0[2] = c === 0 ? shadow : light

          const nx2ColorsFace1 = new Uint16Array(3)
          nx2ColorsFace1[0] = a === 0 ? shadow : light
          nx2ColorsFace1[1] = d === 0 ? shadow : light
          nx2ColorsFace1[2] = c === 0 ? shadow : light

          output[3] = [nx2ColorsFace0, nx2ColorsFace1, [1, 1, 1]]
        } else {
          const nxColorsFace0 = new Uint16Array(3)
          nxColorsFace0[0] = c === 0 ? shadow : light
          nxColorsFace0[1] = b === 0 ? shadow : light
          nxColorsFace0[2] = d === 0 ? shadow : light

          const nxColorsFace1 = new Uint16Array(3)
          nxColorsFace1[0] = b === 0 ? shadow : light
          nxColorsFace1[1] = a === 0 ? shadow : light
          nxColorsFace1[2] = d === 0 ? shadow : light

          output[3] = [nxColorsFace0, nxColorsFace1, [0, 0, 0]]
        }
      }

      if (nz === 0) {
        const a = nzny !== 0 || nxnz !== 0 || nxnzny !== 0 ? 0 : 1
        const b = nzny !== 0 || pxnz !== 0 || pxnzny !== 0 ? 0 : 1
        const c = nzpy !== 0 || pxnz !== 0 || pxnzpy !== 0 ? 0 : 1
        const d = nzpy !== 0 || nxnz !== 0 || nxnzpy !== 0 ? 0 : 1

        const e = nxnzny !== 0 ? 0 : 1
        const f = pxnzny !== 0 ? 0 : 1
        const g = pxnzpy !== 0 ? 0 : 1
        const h = nxnzpy !== 0 ? 0 : 1

        if (e + g < f + h) {
          const nz2ColorsFace0 = new Uint16Array(3)
          nz2ColorsFace0[0] = a === 0 ? shadow : light
          nz2ColorsFace0[1] = b === 0 ? shadow : light
          nz2ColorsFace0[2] = d === 0 ? shadow : light

          const nz2ColorsFace1 = new Uint16Array(3)
          nz2ColorsFace1[0] = b === 0 ? shadow : light
          nz2ColorsFace1[1] = c === 0 ? shadow : light
          nz2ColorsFace1[2] = d === 0 ? shadow : light

          output[4] = [nz2ColorsFace0, nz2ColorsFace1, [1, 1, 1]]
        } else {
          const nzColorsFace0 = new Uint16Array(3)
          nzColorsFace0[0] = d === 0 ? shadow : light
          nzColorsFace0[1] = a === 0 ? shadow : light
          nzColorsFace0[2] = c === 0 ? shadow : light

          const nzColorsFace1 = new Uint16Array(3)
          nzColorsFace1[0] = a === 0 ? shadow : light
          nzColorsFace1[1] = b === 0 ? shadow : light
          nzColorsFace1[2] = c === 0 ? shadow : light

          output[4] = [nzColorsFace0, nzColorsFace1, [0, 0, 0]]
        }
      }

      if (ny === 0) {
        const a = nxny !== 0 || nzny !== 0 || nxnzny !== 0 ? 0 : 1
        const b = nxny !== 0 || pzny !== 0 || nxpzny !== 0 ? 0 : 1
        const c = pxny !== 0 || pzny !== 0 || pxpzny !== 0 ? 0 : 1
        const d = pxny !== 0 || nzny !== 0 || pxnzny !== 0 ? 0 : 1

        const e = nxnzny !== 0 ? 0 : 1
        const f = nxpzny !== 0 ? 0 : 1
        const g = pxpzny !== 0 ? 0 : 1
        const h = pxnzny !== 0 ? 0 : 1

        if (e + g > f + h) {
          const ny2ColorsFace0 = new Uint16Array(3)
          ny2ColorsFace0[0] = b === 0 ? shadow : light
          ny2ColorsFace0[1] = c === 0 ? shadow : light
          ny2ColorsFace0[2] = a === 0 ? shadow : light

          const ny2ColorsFace1 = new Uint16Array(3)
          ny2ColorsFace1[0] = c === 0 ? shadow : light
          ny2ColorsFace1[1] = d === 0 ? shadow : light
          ny2ColorsFace1[2] = a === 0 ? shadow : light

          output[5] = [ny2ColorsFace0, ny2ColorsFace1, [1, 1, 1]]
        } else {
          const nyColorsFace0 = new Uint16Array(3)
          nyColorsFace0[0] = a === 0 ? shadow : light
          nyColorsFace0[1] = b === 0 ? shadow : light
          nyColorsFace0[2] = d === 0 ? shadow : light

          const nyColorsFace1 = new Uint16Array(3)
          nyColorsFace1[0] = b === 0 ? shadow : light
          nyColorsFace1[1] = c === 0 ? shadow : light
          nyColorsFace1[2] = d === 0 ? shadow : light

          output[5] = [nyColorsFace0, nyColorsFace1, [0, 0, 0]]
        }
      }

      return output
    }

    this.getLoadedBlocks = (x, y, z, voxelData, offsets) => {
      const relativeCoords = getRelativeCoords(x, y, z, offsets)
      if (checkWithinChunk(relativeCoords[0], relativeCoords[1], relativeCoords[2])) {
        return self.get(voxelData, relativeCoords[0], relativeCoords[2], relativeCoords[1])
      } else {
        const maxHeight = this.getRelativeHighest(x, z)
        return this.getBlockInfo(x, y, z, maxHeight)
      }
    }

    this.getBlockInfo = (x, y, z, maxHeight) => {
      const cb = this.changedBlocks[getCoordsRepresentation(x, y, z)]

      if (typeof cb === 'number') {
        return cb
      }

      if (y > maxWorldHeight || y <= 0) return 0
      else {
        const isSolid = isSolidAt(x, y, z)
        if (isSolid) {
          if (y >= maxHeight - 3 && y < maxHeight) return 3
          if (y === maxHeight || isTopBlock(x, y, z)) return 2
          return 1
        } else if (y <= waterLevel) {
          return 95
        }
      }
      return 0
    }

    this.registerCB = (changedBlocks = {}) => (this.changedBlocks = changedBlocks)
    this.appendCB = ({ key, type }) => (this.changedBlocks[key] = type)
  }
}
