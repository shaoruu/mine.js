import { ResourceManager, ChunkManager, WorkerManager } from '../../managers'
import Config from '../../../config/config'
import Helpers from '../../../utils/helpers'

const LIQUID = Config.block.liquid

/**
 * world(query: $query) {
      name
      seed
      changedBlocks {
        type
        x
        y
        z
      }
      players {
        id
        isAdmin
        gamemode
        user {
          username
        }
        lastLogin
        x
        y
        z
        dirx
        diry
        inventory {
          cursor
          data
        }
      }
    }
 */

class World {
  constructor(worldData, scene) {
    const { name, seed, changedBlocks } = worldData

    this.name = name

    this.scene = scene

    this.resourceManager = new ResourceManager()
    this.workerManager = new WorkerManager()
    this.chunkManager = new ChunkManager(
      scene,
      seed,
      this.resourceManager,
      this.workerManager,
      changedBlocks
    )

    this.initUpdaters()
  }

  setPlayer = player => {
    this.player = player
  }

  initUpdaters = () => {
    this.envUpdater = window.requestInterval(this.updateEnv, 100)
  }

  update = () => {
    this.chunkManager.update()
  }

  updateEnv = () => {
    const playerPos = this.player.getCoordinates()
    const { coordx, coordy, coordz } = Helpers.blockToChunk(playerPos)
    this.chunkManager.surroundingChunksCheck(coordx, coordy, coordz)
  }

  removeUpdaters = () => {
    window.clearRequestInterval(this.envUpdater)
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getVoxelByVoxelCoords = (x, y, z) => {
    /** RETURN INFORMATION ABOUT CHUNKS */
    const type = this.chunkManager.getTypeAt(x, y, z)

    const isSolid = LIQUID.includes(type)

    return !isSolid
  }
}

export default World
