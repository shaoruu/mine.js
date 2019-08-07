import Helpers from '../../../../utils/helpers'
import Structures from '../../../../config/structures'
import Config from '../../../../config/config'
import { BLOCKS } from '../../../../config/blockDict'
import BaseGenerator from '../baseGenerator/baseGenerator'

import { Noise } from 'noisejs'
import tooloud from 'tooloud'

const STRUCTURES = Structures
const SIZE = Config.chunk.size
const NEIGHBOR_WIDTH = Config.chunk.neighborWidth
const WORLD_CONFIGS = Config.world

const {
  generation: {
    classicGeneration: { waterLevel, maxWorldHeight, mountains }
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
    treeScale,
    grassMin,
    grassScale
  },
  types: { top, underTop, beach }
} = mountains

export default class ClassicGenerator extends BaseGenerator {
  constructor(seed, changedBlocks) {
    super(seed, changedBlocks)

    /* -------------------------------------------------------------------------- */
    /*                               INITIALIZATION                               */
    /* -------------------------------------------------------------------------- */
    this.initNoises()
    this.initMembers()
  }

  initNoises = () => {
    this.noise = new Noise(this.seed)

    // BIOMES
    this.rainfall = new Noise(this.seed * 2)
    this.temp = new Noise(this.seed / 2)
  }

  initMembers = () => {
    this.maxHeights = {}
    this.trees = new Set()
    this.grasses = {}

    this.treeNoise = tooloud.Simplex.create(this.seed)
    this.grassNoise = tooloud.Perlin.create(this.seed)
  }

  isSolidAt = (x, y, z) => {
    // TODO: Check cache first
    return (
      this.getNoise((x * scale) / 100, (y * scale) / 100, (z * scale) / 100) >=
      -0.2
    )
  }

  isSolidAtWithCB = (x, y, z) => {
    const cb = this.getCBAt(x, y, z)
    if (Helpers.isType(cb)) return !!cb
    return this.isSolidAt(x, y, z)
  }

  shouldPlantTree = (x, z, treeScopedMin, treeScopedScale) => {
    const rep = Helpers.get2DCoordsRep(x, z)

    if (this.trees.has(rep)) return true

    const noiseVal = Helpers.normalizeNoise(
      this.treeNoise.noise(x * treeScopedScale, z * treeScopedScale, 0)
    )
    const shouldPlant = noiseVal >= treeScopedMin

    if (shouldPlant) this.trees.add(rep)

    return shouldPlant
  }

  shouldPlantGrass = (x, z, grassScopedMin, grassScopedScale) => {
    const rep = Helpers.get2DCoordsRep(x, z)

    const noiseVal = Helpers.normalizeNoise(
      this.grassNoise.noise(x * grassScopedScale, z * grassScopedScale, 0)
    )

    if (noiseVal < grassScopedMin) return false

    this.grasses[rep] = {
      dx: Helpers.round(this.grassNoise.noise(x * 0.5, z * 0.6, 0) / 3, 2),
      dz: Helpers.round(this.grassNoise.noise(x * 0.6, z * 0.5, 0) / 3, 2)
    }

    return true
  }

  setVoxelData = (voxelData, coordx, coordy, coordz) => {
    const offsets = Helpers.getOffsets(coordx, coordy, coordz)

    // ACTUAL
    for (let x = offsets[0]; x < offsets[0] + SIZE + NEIGHBOR_WIDTH * 2; x++)
      for (
        let z = offsets[2];
        z < offsets[2] + SIZE + NEIGHBOR_WIDTH * 2;
        z++
      ) {
        const maxHeight = this.getHighestBlock(x, z)
        for (
          let y = offsets[1];
          y < offsets[1] + SIZE + NEIGHBOR_WIDTH * 2;
          y++
        ) {
          const blockType = this.getBlockInfo(x, y, z, maxHeight)
          const mappedCoords = Helpers.getRelativeCoords(x, y, z, offsets)

          voxelData.set(
            mappedCoords.x,
            mappedCoords.z,
            mappedCoords.y,
            blockType
          )
        }
      }

    // TREES
    for (let x = offsets[0]; x < offsets[0] + SIZE + NEIGHBOR_WIDTH * 2; x++)
      for (
        let z = offsets[2];
        z < offsets[2] + SIZE + NEIGHBOR_WIDTH * 2;
        z++
      ) {
        const maxHeight = this.getHighestBlock(x, z)

        const type = Helpers.getLoadedBlocks(
          x,
          maxHeight,
          z,
          voxelData,
          this,
          offsets
        )

        if (
          (type === 2 || type === 3) &&
          this.getBlockInfo(x, maxHeight + 1, z, maxHeight) === 0
        ) {
          if (this.shouldPlantTree(x, z, treeMin, treeScale)) {
            const { data } = STRUCTURES.BaseTree

            for (let b = 0; b < data.length; b++) {
              const { override, type: treeB, x: dx, y: dy, z: dz } = data[b]
              const mappedCoords = Helpers.getRelativeCoords(
                x + dx,
                maxHeight + dy,
                z + dz,
                offsets
              )

              if (
                Helpers.checkWithinChunk(
                  mappedCoords.x,
                  mappedCoords.y,
                  mappedCoords.z
                )
              )
                if (
                  override ||
                  voxelData.get(
                    mappedCoords.x,
                    mappedCoords.z,
                    mappedCoords.y
                  ) === 0
                )
                  voxelData.set(
                    mappedCoords.x,
                    mappedCoords.z,
                    mappedCoords.y,
                    treeB
                  )
            }
          } else if (this.shouldPlantGrass(x, z, grassMin, grassScale)) {
            const grassPos = { x, y: maxHeight + 1, z }
            const mappedCoords = Helpers.getRelativeCoords(
              grassPos.x,
              grassPos.y,
              grassPos.z,
              offsets
            )

            if (
              Helpers.checkWithinChunk(
                mappedCoords.x,
                mappedCoords.y,
                mappedCoords.z
              )
            )
              voxelData.set(mappedCoords.x, mappedCoords.z, mappedCoords.y, 31)
          }
        }
      }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getOctavePerlin3 = (x, y, z) => {
    let total = 0
    let frequency = 1
    let amplitude = 1
    let maxVal = 0

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

  getNoise = (x, y, z) => this.getOctavePerlin3(x, y, z) - (y * 4) / scale

  getGrassData = (x, z) => this.grasses[Helpers.get2DCoordsRep(x, z)] || null

  getNaiveHighestBlock = (x, z) => {
    let height = 0

    for (let y = maxWorldHeight; y >= 0; y--) {
      const isSolid = this.isSolidAt(x, y, z)

      if (isSolid) height = y
    }

    const rep = Helpers.get2DCoordsRep(x, z)
    this.maxHeights[rep] = height

    return height
  }

  getHighestBlock = (x, z) => {
    const rep = Helpers.get2DCoordsRep(x, z)
    if (this.maxHeights[rep]) return this.maxHeights[rep]

    let high = maxWorldHeight
    let low = waterLevel
    let middle = Math.floor((high + low) / 2)

    while (low <= high) {
      if (
        this.isSolidAtWithCB(x, middle, z) &&
        !this.isSolidAtWithCB(x, middle + 1, z) &&
        !this.isSolidAtWithCB(x, middle + 2, z)
      )
        break
      else if (!this.isSolidAtWithCB(x, middle, z)) high = middle - 1
      else low = middle + 2

      middle = Math.floor((high + low) / 2)
    }

    this.maxHeights[rep] = middle

    return middle
  }

  getBlockInfo = (x, y, z, maxHeight) => {
    let blockId = BLOCKS.EMPTY
    const cb = this.getCBAt(x, y, z)

    if (Helpers.isType(cb)) return cb

    if (y === 0) blockId = BLOCKS.BEDROCK
    else if (y <= maxWorldHeight && y > 0) {
      const isSolid = this.isSolidAt(x, y, z)

      if (isSolid) {
        if (
          y === waterLevel &&
          !this.isSolidAt(x, y + 1, z) &&
          (!this.isSolidAt(x, y, z - 1) ||
            !this.isSolidAt(x - 1, y, z) ||
            !this.isSolidAt(x + 1, y, z) ||
            !this.isSolidAt(x, y, z + 1))
        )
          blockId = beach
        else if (y === maxHeight) {
          if (y < waterLevel) blockId = underTop
          else blockId = top
        } else if (y >= maxHeight - 3 && y < maxHeight) blockId = underTop
        else blockId = BLOCKS.STONE
      } else if (y <= waterLevel) blockId = BLOCKS.WATER
    }

    return blockId
  }
}
