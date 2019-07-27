import Helpers from '../../../../utils/helpers'
import Structures from '../../../../config/structures'
import Config from '../../../../config/config'

import { Noise } from 'noisejs'
import tooloud from 'tooloud'

const STRUCTURES = Structures
const SIZE = Config.chunk.size
const NEIGHBOR_WIDTH = Config.chunk.neighborWidth
const WORLD_CONFIGS = Config.world

const {
  waterLevel,
  maxWorldHeight,
  generation: {
    classicGeneration: { mountains }
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
} = mountains

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
    this.treeNoise = tooloud.Simplex.create(this.seed)
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

  const shouldPlantTree = (x, z, treeScopedMin, treeScopedScale) => {
    const rep = Helpers.get2DCoordsRep(x, z)

    if (this.trees.has(rep)) return true

    const noiseVal = (1 + this.treeNoise.noise(x * treeScopedScale, z * treeScopedScale, 0)) / 2
    const shouldPlant = noiseVal > treeScopedMin

    if (shouldPlant) this.trees.add(rep)

    return shouldPlant
  }

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
          const mappedCoords = Helpers.getRelativeCoords(x, y, z, offsets)

          voxelData.set(mappedCoords.x, mappedCoords.z, mappedCoords.y, blockType)
        }
      }

    // TREES
    for (let x = offsets[0]; x < offsets[0] + SIZE + NEIGHBOR_WIDTH * 2; x++)
      for (let z = offsets[2]; z < offsets[2] + SIZE + NEIGHBOR_WIDTH * 2; z++) {
        const maxHeight = this.getHighestBlock(x, z)

        const type =
          voxelData.get(x - offsets[0], z - offsets[2], maxHeight - offsets[1]) ||
          this.getBlockInfo(x, maxHeight, z, maxHeight)

        if (
          (type === 2 || type === 3) &&
          this.getBlockInfo(x, maxHeight + 1, z, maxHeight) === 0 &&
          shouldPlantTree(x, z, treeMin, treeScale)
        ) {
          const { data } = STRUCTURES.BaseTree

          for (let b = 0; b < data.length; b++) {
            const { override, type: treeB, x: dx, y: dy, z: dz } = data[b]
            const mappedCoords = Helpers.getRelativeCoords(x + dx, maxHeight + dy, z + dz, offsets)

            if (Helpers.checkWithinChunk(mappedCoords.x, mappedCoords.y, mappedCoords.z))
              if (override || voxelData.get(mappedCoords.x, mappedCoords.z, mappedCoords.y) === 0)
                voxelData.set(mappedCoords.x, mappedCoords.z, mappedCoords.y, treeB)
          }
        }
      }
  }
}
