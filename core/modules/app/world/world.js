import { ResourceManager, ChunkManager, WorkerManager } from '../../managers'
import Config from '../../../config/config'
import Helpers from '../../../utils/helpers'
import Stateful from '../../../lib/stateful/stateful'

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

class World extends Stateful {
  constructor(worldData, scene, playerY) {
    super({ isSetup: false })

    const { name, seed, changedBlocks } = worldData

    this.name = name

    this.scene = scene

    this.resourceManager = new ResourceManager()
    this.workerManager = new WorkerManager(this)
    this.chunkManager = new ChunkManager(
      scene,
      seed,
      this.resourceManager,
      this.workerManager,
      changedBlocks
    )

    this.initWorld(playerY)
    this.initUpdaters()
  }

  initWorld = playerY => {
    if (Helpers.approxEquals(playerY, Number.MIN_SAFE_INTEGER, 5))
      this.workerManager.queueSpecificChunk({
        cmd: 'GET_HIGHEST',
        x: 0,
        z: 0
      })
    else this.setState({ isSetup: true })
  }

  initUpdaters = () => {
    this.envUpdater = window.requestInterval(this.updateEnv, 100)
  }

  update = () => {
    this.workerManager.update()
    this.chunkManager.update()
  }

  updateEnv = () => {
    if (!this.state.isSetup) return

    const playerPos = this.player.getCoordinates()
    const { coordx, coordy, coordz } = Helpers.globalBlockToChunkCoords(playerPos)
    this.chunkManager.surroundingChunksCheck(coordx, coordy, coordz)
  }

  removeUpdaters = () => {
    window.clearRequestInterval(this.envUpdater)
  }

  /* -------------------------------------------------------------------------- */
  /*                                   SETTERS                                  */
  /* -------------------------------------------------------------------------- */
  setPlayer = player => (this.player = player)

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getVoxelByVoxelCoords = (x, y, z) => {
    /** RETURN INFORMATION ABOUT CHUNKS */
    const type = this.chunkManager.getTypeAt(x, y, z)
    return type
  }

  getPassableByVoxelCoords = (x, y, z) => {
    const type = this.getVoxelByVoxelCoords(x, y, z)
    if (type !== 0 && !type) return true

    const isSolid = LIQUID.includes(type)
    return !isSolid
  }

  getIsReady = () => this.chunkManager.isReady
}

export default World
