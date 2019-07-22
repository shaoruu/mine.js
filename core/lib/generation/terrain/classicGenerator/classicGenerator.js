import Helpers from '../../../../utils/helpers'
import Structures from '../../../../config/structures'
import Config from '../../../../config/config'

import { Noise } from 'noisejs'

const STRUCTURES = Structures
const SIZE = Config.chunk.size
const NEIGHBOR_WIDTH = Config.chunk.neighborWidth
const LIQUID_BLOCKS = Config.block.liquid
const TRANSPARENT_BLOCKS = Config.block.transparent
const WORLD_CONFIGS = Config.world

const {
  waterLevel,
  maxWorldHeight,
  generation: {
    classicGeneration: { swampland }
  }
} = WORLD_CONFIGS

const {
  constants: {
    scale,
    octaves,
    persistance,
    lacunarity,
    heightOffset,
    amplifier,
    treeMin,
    treeScale
  },
  types: { top, underTop, beach }
} = swampland

export default function ClassicGenerator(seed) {
  /* -------------------------------------------------------------------------- */
  /*                               INITIALIZATION                               */
  /* -------------------------------------------------------------------------- */
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

  const initMembers = () => {
    this.maxHeights = {}
    this.trees = new Set()
  }

  initSeed(seed)
  initNoises()
  initMembers()

  /* -------------------------------------------------------------------------- */
  /*                              HELPER FUNCTIONS                              */
  /* -------------------------------------------------------------------------- */
  const getNoise = (x, y, z) => this.octavePerlin3(x, y, z) - (y * 4) / scale

  const isSolidAt = (x, y, z) => {
    // TODO: Check cache first
    return getNoise((x * scale) / 100, (y * scale) / 100, (z * scale) / 100) >= -0.2
  }

  const isSolidAtWithCB = (x, y, z) => {
    const cb = this.changedBlocks[Helpers.get3DCoordsRep(x, y, z)]
    if (cb) return !!cb
    return isSolidAt(x, y, z)
  }

  const isTransparent = type => TRANSPARENT_BLOCKS.includes(type)

  const isLiquid = type => LIQUID_BLOCKS.includes(type)

  const shouldPlantTree = (x, z, treeScopedMin, treeScopedScale) => {
    const rep = Helpers.get2DCoordsRep(x, z)

    if (this.trees.has(rep)) return true

    const shouldPlant =
      this.noise.simplex2(x / treeScopedScale, z / treeScopedScale) > treeScopedMin

    if (shouldPlant) this.trees.add(rep)

    return shouldPlant
  }

  const getRelativeCoords = (x, y, z, offsets) => ({
    x: x - offsets[0],
    y: y - offsets[1],
    z: z - offsets[2]
  })

  const getAbsoluteCoords = (x, y, z, offsets) => ({
    x: x + offsets[0],
    y: y + offsets[1],
    z: z + offsets[2]
  })

  const checkWithinChunk = (x, y, z) =>
    x >= 0 &&
    x < SIZE + NEIGHBOR_WIDTH * 2 &&
    y >= 0 &&
    y < SIZE + NEIGHBOR_WIDTH * 2 &&
    z >= 0 &&
    z < SIZE + NEIGHBOR_WIDTH * 2

  /* -------------------------------------------------------------------------- */
  /*                              MEMBER FUNCTIONS                              */
  /* -------------------------------------------------------------------------- */
  this.getNaiveHighestBlock = (x, z) => {
    let height = 0

    for (let y = maxWorldHeight; y >= 0; y--) {
      const isSolid = isSolidAt(x, y, z)

      if (isSolid) height = y
    }

    const rep = Helpers.get2DCoordsRep(x, z)
    this.maxHeights[rep] = height

    return height
  }

  this.getHighestBlock = (x, z) => {
    const rep = Helpers.get2DCoordsRep(x, z)
    if (this.maxHeights[rep]) return this.maxHeights[rep]

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

    this.maxHeights[rep] = middle

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

  this.getLoadedBlocks = (x, y, z, voxelData, offsets) => {
    const relativeCoords = getRelativeCoords(x, y, z, offsets)
    if (checkWithinChunk(relativeCoords.x, relativeCoords.y, relativeCoords.z)) {
      return voxelData.get(relativeCoords.x, relativeCoords.z, relativeCoords.y)
    }
    const maxHeight = this.getHighestBlock(x, z)
    return this.getBlockInfo(x, y, z, maxHeight)
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

    const lights = new Uint8Array(surroundings.length)

    for (let i = 0; i < surroundings.length; i++) {
      const block = {
        x: x + surroundings[i].x,
        y: y + surroundings[i].y,
        z: z + surroundings[i].z,
        lightLevel: 15
      }
      const value = this.getLoadedBlocks(block.x, block.y, block.z, voxelData, offsets)
      if (isTransparent(value)) {
        const pastNodeCoords = new Set([Helpers.get3DCoordsRep(block.x, -1, block.z)])
        const queue = [block]

        while (queue.length > 0) {
          const q = queue.shift()
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
              pastNodeCoords.has(Helpers.get3DCoordsRep(newNode.x, newNode.y, newNode.z)) ||
              newNode.lightLevel < 0
            )
              continue

            let yValue = q.y

            let startValue = 0

            let endValue = this.getLoadedBlocks(newNode.x, yValue, newNode.z, voxelData, offsets)

            while (isTransparent(startValue) && !isTransparent(endValue)) {
              yValue += 1
              startValue = this.getLoadedBlocks(q.x, yValue, q.z, voxelData, offsets)
              endValue = this.getLoadedBlocks(newNode.x, yValue, newNode.z, voxelData, offsets)
            }

            if (!isTransparent(startValue) || !isTransparent(endValue)) continue

            newNode.y = yValue

            queue.push(newNode)
            pastNodeCoords.add(Helpers.get3DCoordsRep(newNode.x, -1, newNode.z))
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

    const nxnzny = voxelData.get(x - 1, z - 1, y - 1)
    const nzny = voxelData.get(x, z - 1, y - 1)
    const pxnzny = voxelData.get(x + 1, z - 1, y - 1)
    const nxny = voxelData.get(x - 1, z, y - 1)
    const ny = voxelData.get(x, z, y - 1)
    const pxny = voxelData.get(x + 1, z, y - 1)
    const nxpzny = voxelData.get(x - 1, z + 1, y - 1)
    const pzny = voxelData.get(x, z + 1, y - 1)
    const pxpzny = voxelData.get(x + 1, z + 1, y - 1)

    const nxnz = voxelData.get(x - 1, z - 1, y)
    const nz = voxelData.get(x, z - 1, y)
    const pxnz = voxelData.get(x + 1, z - 1, y)
    const nx = voxelData.get(x - 1, z, y)
    const px = voxelData.get(x + 1, z, y)
    const nxpz = voxelData.get(x - 1, z + 1, y)
    const pz = voxelData.get(x, z + 1, y)
    const pxpz = voxelData.get(x + 1, z + 1, y)

    const nxnzpy = voxelData.get(x - 1, z - 1, y + 1)
    const nzpy = voxelData.get(x, z - 1, y + 1)
    const pxnzpy = voxelData.get(x + 1, z - 1, y + 1)
    const nxpy = voxelData.get(x - 1, z, y + 1)
    const py = voxelData.get(x, z, y + 1)
    const pxpy = voxelData.get(x + 1, z, y + 1)
    const nxpzpy = voxelData.get(x - 1, z + 1, y + 1)
    const pzpy = voxelData.get(x, z + 1, y + 1)
    const pxpzpy = voxelData.get(x + 1, z + 1, y + 1)

    if (isTransparent(py)) {
      const a = !isTransparent(nxpy) || !isTransparent(nzpy) || !isTransparent(nxnzpy) ? 0 : 1
      const b = !isTransparent(nxpy) || !isTransparent(pzpy) || !isTransparent(nxpzpy) ? 0 : 1
      const c = !isTransparent(pxpy) || !isTransparent(pzpy) || !isTransparent(pxpzpy) ? 0 : 1
      const d = !isTransparent(pxpy) || !isTransparent(nzpy) || !isTransparent(pxnzpy) ? 0 : 1

      const e = !isTransparent(nxnzpy) ? 0 : 1
      const f = !isTransparent(nxpzpy) ? 0 : 1
      const g = !isTransparent(pxpzpy) ? 0 : 1
      const h = !isTransparent(pxnzpy) ? 0 : 1

      if (e + g > f + h) {
        const py2ColorsFace0 = new Uint8Array(3)
        py2ColorsFace0[0] = b === 0 ? shadow : light
        py2ColorsFace0[1] = c === 0 ? shadow : light
        py2ColorsFace0[2] = a === 0 ? shadow : light

        const py2ColorsFace1 = new Uint8Array(3)
        py2ColorsFace1[0] = c === 0 ? shadow : light
        py2ColorsFace1[1] = d === 0 ? shadow : light
        py2ColorsFace1[2] = a === 0 ? shadow : light

        output[0] = [py2ColorsFace0, py2ColorsFace1, [1, 1, 1]]
      } else {
        const pyColorsFace0 = new Uint8Array(3)
        pyColorsFace0[0] = a === 0 ? shadow : light
        pyColorsFace0[1] = b === 0 ? shadow : light
        pyColorsFace0[2] = d === 0 ? shadow : light

        const pyColorsFace1 = new Uint8Array(3)
        pyColorsFace1[0] = b === 0 ? shadow : light
        pyColorsFace1[1] = c === 0 ? shadow : light
        pyColorsFace1[2] = d === 0 ? shadow : light

        output[0] = [pyColorsFace0, pyColorsFace1, [0, 0, 0]]
      }
    }

    if (isTransparent(px)) {
      const a = !isTransparent(pxny) || !isTransparent(pxnz) || !isTransparent(pxnzny) ? 0 : 1
      const b = !isTransparent(pxny) || !isTransparent(pxpz) || !isTransparent(pxpzny) ? 0 : 1
      const c = !isTransparent(pxpy) || !isTransparent(pxpz) || !isTransparent(pxpzpy) ? 0 : 1
      const d = !isTransparent(pxpy) || !isTransparent(pxnz) || !isTransparent(pxnzpy) ? 0 : 1

      const e = !isTransparent(pxnzny) ? 0 : 1
      const f = !isTransparent(pxpzny) ? 0 : 1
      const g = !isTransparent(pxpzpy) ? 0 : 1
      const h = !isTransparent(pxnzpy) ? 0 : 1

      if (e + g > f + h) {
        const px2ColorsFace0 = new Uint8Array(3)
        px2ColorsFace0[0] = b === 0 ? shadow : light
        px2ColorsFace0[1] = a === 0 ? shadow : light
        px2ColorsFace0[2] = c === 0 ? shadow : light

        const px2ColorsFace1 = new Uint8Array(3)
        px2ColorsFace1[0] = a === 0 ? shadow : light
        px2ColorsFace1[1] = d === 0 ? shadow : light
        px2ColorsFace1[2] = c === 0 ? shadow : light

        output[1] = [px2ColorsFace0, px2ColorsFace1, [1, 1, 1]]
      } else {
        const pxColorsFace0 = new Uint8Array(3)
        pxColorsFace0[0] = c === 0 ? shadow : light
        pxColorsFace0[1] = b === 0 ? shadow : light
        pxColorsFace0[2] = d === 0 ? shadow : light

        const pxColorsFace1 = new Uint8Array(3)
        pxColorsFace1[0] = b === 0 ? shadow : light
        pxColorsFace1[1] = a === 0 ? shadow : light
        pxColorsFace1[2] = d === 0 ? shadow : light

        output[1] = [pxColorsFace0, pxColorsFace1, [0, 0, 0]]
      }
    }

    if (isTransparent(pz)) {
      const a = !isTransparent(pzny) || !isTransparent(nxpz) || !isTransparent(nxpzny) ? 0 : 1
      const b = !isTransparent(pzny) || !isTransparent(pxpz) || !isTransparent(pxpzny) ? 0 : 1
      const c = !isTransparent(pzpy) || !isTransparent(pxpz) || !isTransparent(pxpzpy) ? 0 : 1
      const d = !isTransparent(pzpy) || !isTransparent(nxpz) || !isTransparent(nxpzpy) ? 0 : 1

      const e = !isTransparent(nxpzny) ? 0 : 1
      const f = !isTransparent(pxpzny) ? 0 : 1
      const g = !isTransparent(pxpzpy) ? 0 : 1
      const h = !isTransparent(nxpzpy) ? 0 : 1

      if (e + g < f + h) {
        const pz2ColorsFace0 = new Uint8Array(3)
        pz2ColorsFace0[0] = a === 0 ? shadow : light
        pz2ColorsFace0[1] = b === 0 ? shadow : light
        pz2ColorsFace0[2] = d === 0 ? shadow : light

        const pz2ColorsFace1 = new Uint8Array(3)
        pz2ColorsFace1[0] = b === 0 ? shadow : light
        pz2ColorsFace1[1] = c === 0 ? shadow : light
        pz2ColorsFace1[2] = d === 0 ? shadow : light

        output[2] = [pz2ColorsFace0, pz2ColorsFace1, [1, 1, 1]]
      } else {
        const pzColorsFace0 = new Uint8Array(3)
        pzColorsFace0[0] = d === 0 ? shadow : light
        pzColorsFace0[1] = a === 0 ? shadow : light
        pzColorsFace0[2] = c === 0 ? shadow : light

        const pzColorsFace1 = new Uint8Array(3)
        pzColorsFace1[0] = a === 0 ? shadow : light
        pzColorsFace1[1] = b === 0 ? shadow : light
        pzColorsFace1[2] = c === 0 ? shadow : light

        output[2] = [pzColorsFace0, pzColorsFace1, [0, 0, 0]]
      }
    }

    if (isTransparent(nx)) {
      const a = !isTransparent(nxny) || !isTransparent(nxnz) || !isTransparent(nxnzny) ? 0 : 1
      const b = !isTransparent(nxny) || !isTransparent(nxpz) || !isTransparent(nxpzny) ? 0 : 1
      const c = !isTransparent(nxpy) || !isTransparent(nxpz) || !isTransparent(nxpzpy) ? 0 : 1
      const d = !isTransparent(nxpy) || !isTransparent(nxnz) || !isTransparent(nxnzpy) ? 0 : 1

      const e = !isTransparent(nxnzny) ? 0 : 1
      const f = !isTransparent(nxpzny) ? 0 : 1
      const g = !isTransparent(nxpzpy) ? 0 : 1
      const h = !isTransparent(nxnzpy) ? 0 : 1

      if (e + g > f + h) {
        const nx2ColorsFace0 = new Uint8Array(3)
        nx2ColorsFace0[0] = b === 0 ? shadow : light
        nx2ColorsFace0[1] = a === 0 ? shadow : light
        nx2ColorsFace0[2] = c === 0 ? shadow : light

        const nx2ColorsFace1 = new Uint8Array(3)
        nx2ColorsFace1[0] = a === 0 ? shadow : light
        nx2ColorsFace1[1] = d === 0 ? shadow : light
        nx2ColorsFace1[2] = c === 0 ? shadow : light

        output[3] = [nx2ColorsFace0, nx2ColorsFace1, [1, 1, 1]]
      } else {
        const nxColorsFace0 = new Uint8Array(3)
        nxColorsFace0[0] = c === 0 ? shadow : light
        nxColorsFace0[1] = b === 0 ? shadow : light
        nxColorsFace0[2] = d === 0 ? shadow : light

        const nxColorsFace1 = new Uint8Array(3)
        nxColorsFace1[0] = b === 0 ? shadow : light
        nxColorsFace1[1] = a === 0 ? shadow : light
        nxColorsFace1[2] = d === 0 ? shadow : light

        output[3] = [nxColorsFace0, nxColorsFace1, [0, 0, 0]]
      }
    }

    if (isTransparent(nz)) {
      const a = !isTransparent(nzny) || !isTransparent(nxnz) || !isTransparent(nxnzny) ? 0 : 1
      const b = !isTransparent(nzny) || !isTransparent(pxnz) || !isTransparent(pxnzny) ? 0 : 1
      const c = !isTransparent(nzpy) || !isTransparent(pxnz) || !isTransparent(pxnzpy) ? 0 : 1
      const d = !isTransparent(nzpy) || !isTransparent(nxnz) || !isTransparent(nxnzpy) ? 0 : 1

      const e = !isTransparent(nxnzny) ? 0 : 1
      const f = !isTransparent(pxnzny) ? 0 : 1
      const g = !isTransparent(pxnzpy) ? 0 : 1
      const h = !isTransparent(nxnzpy) ? 0 : 1

      if (e + g < f + h) {
        const nz2ColorsFace0 = new Uint8Array(3)
        nz2ColorsFace0[0] = a === 0 ? shadow : light
        nz2ColorsFace0[1] = b === 0 ? shadow : light
        nz2ColorsFace0[2] = d === 0 ? shadow : light

        const nz2ColorsFace1 = new Uint8Array(3)
        nz2ColorsFace1[0] = b === 0 ? shadow : light
        nz2ColorsFace1[1] = c === 0 ? shadow : light
        nz2ColorsFace1[2] = d === 0 ? shadow : light

        output[4] = [nz2ColorsFace0, nz2ColorsFace1, [1, 1, 1]]
      } else {
        const nzColorsFace0 = new Uint8Array(3)
        nzColorsFace0[0] = d === 0 ? shadow : light
        nzColorsFace0[1] = a === 0 ? shadow : light
        nzColorsFace0[2] = c === 0 ? shadow : light

        const nzColorsFace1 = new Uint8Array(3)
        nzColorsFace1[0] = a === 0 ? shadow : light
        nzColorsFace1[1] = b === 0 ? shadow : light
        nzColorsFace1[2] = c === 0 ? shadow : light

        output[4] = [nzColorsFace0, nzColorsFace1, [0, 0, 0]]
      }
    }

    if (isTransparent(ny)) {
      const a = !isTransparent(nxny) || !isTransparent(nzny) || !isTransparent(nxnzny) ? 0 : 1
      const b = !isTransparent(nxny) || !isTransparent(pzny) || !isTransparent(nxpzny) ? 0 : 1
      const c = !isTransparent(pxny) || !isTransparent(pzny) || !isTransparent(pxpzny) ? 0 : 1
      const d = !isTransparent(pxny) || !isTransparent(nzny) || !isTransparent(pxnzny) ? 0 : 1

      const e = !isTransparent(nxnzny) ? 0 : 1
      const f = !isTransparent(nxpzny) ? 0 : 1
      const g = !isTransparent(pxpzny) ? 0 : 1
      const h = !isTransparent(pxnzny) ? 0 : 1

      if (e + g > f + h) {
        const ny2ColorsFace0 = new Uint8Array(3)
        ny2ColorsFace0[0] = b === 0 ? shadow : light
        ny2ColorsFace0[1] = c === 0 ? shadow : light
        ny2ColorsFace0[2] = a === 0 ? shadow : light

        const ny2ColorsFace1 = new Uint8Array(3)
        ny2ColorsFace1[0] = c === 0 ? shadow : light
        ny2ColorsFace1[1] = d === 0 ? shadow : light
        ny2ColorsFace1[2] = a === 0 ? shadow : light

        output[5] = [ny2ColorsFace0, ny2ColorsFace1, [1, 1, 1]]
      } else {
        const nyColorsFace0 = new Uint8Array(3)
        nyColorsFace0[0] = a === 0 ? shadow : light
        nyColorsFace0[1] = b === 0 ? shadow : light
        nyColorsFace0[2] = d === 0 ? shadow : light

        const nyColorsFace1 = new Uint8Array(3)
        nyColorsFace1[0] = b === 0 ? shadow : light
        nyColorsFace1[1] = c === 0 ? shadow : light
        nyColorsFace1[2] = d === 0 ? shadow : light

        output[5] = [nyColorsFace0, nyColorsFace1, [0, 0, 0]]
      }
    }

    return output
  }

  this.getBlockInfo = (x, y, z, maxHeight) => {
    let blockId = 0
    const cb = this.changedBlocks[Helpers.get3DCoordsRep(x, y, z)]

    if (typeof cb === 'number') return cb

    if (y > maxWorldHeight || y <= 0) blockId = 0
    else {
      const isSolid = isSolidAt(x, y, z)

      if (isSolid) {
        if (
          y === waterLevel &&
          !isSolidAt(x, y + 1, z) &&
          (!isSolidAt(x, y, z - 1) ||
            !isSolidAt(x - 1, y, z) ||
            !isSolidAt(x + 1, y, z) ||
            !isSolidAt(x, y, z + 1))
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

  this.setVoxelData = (voxelData, coordx, coordy, coordz) => {
    const offsets = [
      coordx * SIZE - NEIGHBOR_WIDTH,
      coordy * SIZE - NEIGHBOR_WIDTH,
      coordz * SIZE - NEIGHBOR_WIDTH
    ]

    // ACTUAL
    for (let x = offsets[0]; x < offsets[0] + SIZE + NEIGHBOR_WIDTH * 2; x++)
      for (let z = offsets[2]; z < offsets[2] + SIZE + NEIGHBOR_WIDTH * 2; z++) {
        const maxHeight = this.getHighestBlock(x, z)
        for (let y = offsets[1]; y < offsets[1] + SIZE + NEIGHBOR_WIDTH * 2; y++) {
          const blockType = this.getBlockInfo(x, y, z, maxHeight)
          const mappedCoords = getRelativeCoords(x, y, z, offsets)

          voxelData.set(mappedCoords.x, mappedCoords.z, mappedCoords.y, blockType)
        }
      }

    // TREES
    for (let x = offsets[0]; x < offsets[0] + SIZE + NEIGHBOR_WIDTH * 2; x++)
      for (let z = offsets[2]; z < offsets[2] + SIZE + NEIGHBOR_WIDTH * 2; z++) {
        const maxHeight = this.getHighestBlock(x, z)

        const type = voxelData.get(x, maxHeight, z) || this.getBlockInfo(x, maxHeight, z, maxHeight)

        if (
          (type === 2 || type === 3) &&
          this.getBlockInfo(x, maxHeight + 1, z, maxHeight) === 0 &&
          shouldPlantTree(x, z, treeMin, treeScale)
        ) {
          const { data } = STRUCTURES.BaseTree

          for (let b = 0; b < data.length; b++) {
            const { override, type: treeB, x: dx, y: dy, z: dz } = data[b]
            const mappedCoords = getRelativeCoords(x + dx, maxHeight + dy, z + dz, offsets)

            if (checkWithinChunk(mappedCoords.x, mappedCoords.y, mappedCoords.z))
              if (override || voxelData.get(mappedCoords.x, mappedCoords.z, mappedCoords.y) === 0)
                voxelData.set(mappedCoords.x, mappedCoords.z, mappedCoords.y, treeB)
          }
        }
      }
  }

  this.setLightingData = (lightingData, smoothLightingData, voxelData, coordx, coordy, coordz) => {
    const offsets = [
      coordx * SIZE - NEIGHBOR_WIDTH,
      coordy * SIZE - NEIGHBOR_WIDTH,
      coordz * SIZE - NEIGHBOR_WIDTH
    ]

    for (let x = NEIGHBOR_WIDTH; x < SIZE + NEIGHBOR_WIDTH; x++)
      for (let z = NEIGHBOR_WIDTH; z < SIZE + NEIGHBOR_WIDTH; z++)
        for (let y = NEIGHBOR_WIDTH; y < SIZE + NEIGHBOR_WIDTH; y++) {
          if (!isLiquid(voxelData.get(x, z, y))) {
            const tempCoords = getAbsoluteCoords(x, y, z, offsets)

            const tempx = tempCoords.x
            const tempy = tempCoords.y
            const tempz = tempCoords.z

            const lighting = this.getBlockLighting(tempx, tempy, tempz, voxelData, offsets)
            for (let l = 0; l < 6; l++) {
              lightingData.set(
                x - NEIGHBOR_WIDTH,
                z - NEIGHBOR_WIDTH,
                y - NEIGHBOR_WIDTH,
                l,
                lighting[l]
              )
            }

            const smoothLighting = this.getBlockSmoothLighting(x, y, z, voxelData)
            for (let l = 0; l < 6; l++) {
              if (smoothLighting[l]) {
                for (let m = 0; m < 3; m++)
                  for (let n = 0; n < 3; n++) {
                    smoothLightingData.set(
                      x - NEIGHBOR_WIDTH,
                      z - NEIGHBOR_WIDTH,
                      y - NEIGHBOR_WIDTH,
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
}
