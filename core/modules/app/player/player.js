import Stateful from '../../../lib/stateful/stateful'
import Helpers from '../../../utils/helpers'
import Config from '../../../config/config'
import { UPDATE_PLAYER_MUTATION, PLAYER_SUBSCRIPTION } from '../../../lib/graphql'

import Status from './status/status'
import PlayerControls from './controls/controls'
import PlayerViewport from './viewport/viewport'

const P_I_2_TOE = Config.player.aabb.eye2toe

class Player extends Stateful {
  constructor(apolloClient, ioClient, playerData, camera, scene, world, canvas, blocker, button) {
    super({ prevPos: '', prevDir: '' })

    const { id, user, gamemode } = playerData

    this.data = {
      id,
      user
    }

    this.apolloClient = apolloClient
    this.ioClient = ioClient

    this.camera = camera
    this.world = world

    this.status = new Status(gamemode, this)

    /** CONTROL CENTER */
    this.controls = new PlayerControls(
      this,
      world,
      this.status,
      camera,
      canvas,
      blocker,
      button,
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

    this.viewport = new PlayerViewport(this, world, scene)

    scene.add(this.controls.getObject())

    this.initUpdaters()
    this.initSubscriptions()
  }

  initUpdaters = () => {
    this.posUpdater = window.requestInterval(() => {
      const { prevPos, prevDir } = this.state

      const playerCoords = this.getCoordinates(3)
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
            id: this.data.id,
            ...playerCoords,
            ...playerDir
          }
        })
      }
    }, 500)
  }

  initSubscriptions = () => {
    const k = this.apolloClient.subscribe({
      query: PLAYER_SUBSCRIPTION,
      variables: {
        username: this.data.user.username,
        worldId: this.world.data.id,
        mutation_in: ['UPDATED'],
        updatedFields_contains_some: ['gamemode']
      }
    })
    this.playerSubscription = k.subscribe({
      next: ({ data }) => {
        this.handleServerUpdate(data)
      },
      error(e) {
        Helpers.error(e.message)
      }
    })
  }

  update = () => {
    if (!this.world.getIsReady()) return
    this.controls.tick()
    this.status.tick()
    this.viewport.tick()
  }

  handleServerUpdate = ({
    player: {
      node: { gamemode }
    }
  }) => {
    this.status.setGamemode(gamemode)
  }

  removeUpdaters = () => {
    window.clearRequestInterval(this.posUpdater)
  }

  terminate = () => {
    this.playerSubscription.unsubscribe()
    // delete this.playerSubscription
    this.removeUpdaters()
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getCamera = () => this.camera

  getCamCoordinates = dec => this.controls.getNormalizedCamPos(dec)

  getCoordinates = dec => this.controls.getFeetCoords(dec)

  getChunkInfo = () => this.controls.getChunkCoords()

  getDirections = () => this.controls.getDirections()

  getHeight = () => this.getCoordinates().y

  getPosition = () => this.controls.getObject().position

  getObject = () => this.controls.getObject()

  /* -------------------------------------------------------------------------- */
  /*                                   SETTERS                                  */
  /* -------------------------------------------------------------------------- */
  setPosition = (x, y, z) => this.controls.getObject().position.set(x, y, z)

  setHeight = y => this.controls.getObject().position.setY(y + P_I_2_TOE)
}

export default Player
