import BaseGenerator from '../baseGenerator/baseGenerator'
import Helpers from '../../../../utils/helpers'
import Config from '../../../../config/config'
import { BLOCKS } from '../../../../config/blockDict'

const SIZE = Config.chunk.size
const NEIGHBOR_WIDTH = Config.chunk.neighborWidth
const WORLD_CONFIGS = Config.world

const {
  generation: {
    superflatGeneration: {
      maxHeight,
      types: { top, middle }
    }
  }
} = WORLD_CONFIGS

export default class SuperFlatGenerator extends BaseGenerator {
  constructor(seed, changedBlocks) {
    super(seed, changedBlocks)

    /* -------------------------------------------------------------------------- */
    /*                               INITIALIZATION                               */
    /* -------------------------------------------------------------------------- */
    this.initMembers()
  }

  initMembers = () => {}

  getHighestBlock = () => maxHeight

  setVoxelData = (voxelData, coordx, coordy, coordz) => {
    const offsets = Helpers.getOffsets(coordx, coordy, coordz)

    // ACTUAL
    for (let x = offsets[0]; x < offsets[0] + SIZE + NEIGHBOR_WIDTH * 2; x++)
      for (let z = offsets[2]; z < offsets[2] + SIZE + NEIGHBOR_WIDTH * 2; z++)
        for (
          let y = offsets[1];
          y < offsets[1] + SIZE + NEIGHBOR_WIDTH * 2;
          y++
        ) {
          const blockType = this.getBlockInfo(x, y, z)
          const mappedCoords = Helpers.getRelativeCoords(x, y, z, offsets)

          voxelData.set(
            mappedCoords.x,
            mappedCoords.z,
            mappedCoords.y,
            blockType
          )
        }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getBlockInfo = (x, y, z) => {
    const cb = this.getCBAt(x, y, z)
    if (Helpers.isType(cb)) return cb
    if (y > maxHeight || y < 0) return BLOCKS.EMPTY
    if (y === maxHeight) return top
    if (y > 0 && y < maxHeight) return middle
    return BLOCKS.BEDROCK
  }
}
