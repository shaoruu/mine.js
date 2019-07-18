import Stateful from '../../../lib/stateful/stateful'
import Helpers from '../../../utils/helpers'
import Config from '../../../config/config'
import { UPDATE_PLAYER_MUTATION } from '../../../lib/graphql'

import Status from './status/status'
import PlayerControls from './controls/controls'

const P_I_2_TOE = Config.player.aabb.eye2toe

class Player extends Stateful {
  constructor(apolloClient, playerData, camera, scene, world, container, blocker) {
    super({ prevPos: '', prevDir: '' })

    const { id, gamemode } = playerData
    this.id = id

    this.apolloClient = apolloClient

    this.camera = camera
    this.world = world

    this.status = new Status(gamemode, this)

    /** CONTROL CENTER */
    this.controls = new PlayerControls(
      this,
      world,
      this.status,
      camera,
      container,
      blocker,
      {
        x: playerData.x,
        y: playerData.y,
        z: playerData.z
      },
      {
        dirx: playerData.dirx,
        diry: playerData.diry
      }
    )

    scene.add(this.controls.getObject())

    this.initUpdaters()
  }

  initUpdaters = () => {
    this.posUpdater = window.requestInterval(() => {
      const { prevPos, prevDir } = this.state

      const playerCoords = this.getCoordinates()
      const playerCoordsRep = Helpers.get3DCoordsRep(playerCoords.x, playerCoords.y, playerCoords.z)

      const playerDir = this.getDirections()
      const playerDirRep = Helpers.get2DCoordsRep(playerDir.dirx, playerDir.diry)

      // eslint-disable-next-line no-restricted-syntax
      for (const member in playerCoords)
        if (playerCoords[member] !== 0 && !playerCoords[member]) return
      // eslint-disable-next-line no-restricted-syntax
      for (const member in playerDir) if (playerDir[member] !== 0 && !playerDir[member]) return

      if (playerCoordsRep !== prevPos || playerDirRep !== prevDir) {
        this.setState({ prevPos: playerCoordsRep, prevDir: playerDirRep })

        this.apolloClient.mutate({
          mutation: UPDATE_PLAYER_MUTATION,
          variables: {
            id: this.id,
            ...playerCoords,
            ...playerDir
          }
        })
      }
    }, 500)
  }

  update = () => {
    if (!this.world.getIsReady()) return
    this.controls.tick()
    this.status.tick()
  }

  removeUpdaters = () => {
    window.clearRequestInterval(this.posUpdater)
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getCoordinates = () => this.controls.getFeetCoords()

  getDirections = () => this.controls.getDirections()

  getHeight = () => this.getCoordinates().y

  getPosition = () => this.controls.getObject().position

  /* -------------------------------------------------------------------------- */
  /*                                   SETTERS                                  */
  /* -------------------------------------------------------------------------- */
  setPosition = (x, y, z) => this.controls.getObject().position.set(x, y, z)

  setHeight = y => this.controls.getObject().position.setY(y + P_I_2_TOE)
}

export default Player
