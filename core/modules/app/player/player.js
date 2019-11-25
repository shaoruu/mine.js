import Stateful from '../../../lib/stateful/stateful'
import Helpers from '../../../utils/helpers'
import Config from '../../../config/config'
import {
  UPDATE_PLAYER_MUTATION,
  PLAYER_SUBSCRIPTION
} from '../../../lib/graphql'
import { Inventory } from '../../interfaces'
import PlayerObject from '../../../lib/playerObject/playerObject'
import ian13456 from '../../../assets/skin/ian13456.png'

import Status from './status/status'
import Controls from './controls/controls'
import Viewport from './viewport/viewport'

import { Vector2, Vector3 } from 'three'

const P_I_2_TOE = Config.player.aabb.eye2toe
const HEALTH_MIN = Config.player.health.min
class Player extends Stateful {
  constructor(
    apolloClient,
    ioClient,
    playerData,
    camera,
    scene,
    world,
    canvas,
    blocker,
    button,
    container,
    resourceManager
  ) {
    super({ prevPos: '', prevDir: '' })

    this.playerData = playerData
    const { id, user, inventory } = playerData

    this.data = {
      id,
      user
    }

    this.apolloClient = apolloClient
    this.ioClient = ioClient

    this.camera = camera
    this.world = world

    this.skin = new PlayerObject(
      ian13456,
      new Vector3(playerData.x, playerData.y, playerData.z),
      new Vector2(playerData.dirx, playerData.diry),
      playerData.gamemode,
      { visible: true }
    )
    scene.add(this.skin)

    this.status = new Status(this, playerData, container, resourceManager)

    this.inventory = new Inventory(
      this.data.playerId,
      id,
      container,
      inventory.cursor,
      inventory.data,
      resourceManager
    )

    /** CONTROL CENTER */
    this.controls = new Controls(
      this,
      world,
      this.status,
      camera,
      canvas,
      blocker,
      button,
      {
        x: this.playerData.x,
        y: this.playerData.y,
        z: this.playerData.z
      },
      {
        dirx: this.playerData.dirx,
        diry: this.playerData.diry
      }
    )

    this.viewport = new Viewport(this, world, scene)

    scene.add(this.controls.getObject())

    this.initUpdaters()
    this.initSubscriptions()
  }

  initUpdaters = () => {
    if (this.world.playersManager.getPlayerCount() > 0)
      this.posSocketUpdater = window.requestInterval(() => {
        const playerCoords = this.getCoordinates(3)
        const playerDir = this.getDirections()

        this.ioClient.emit('position', {
          playerCoords,
          playerDir
        })
      }, 100)
  }

  initSubscriptions = () => {
    this.playerSubscription = this.apolloClient
      .subscribe({
        query: PLAYER_SUBSCRIPTION,
        variables: {
          username: this.data.user.username,
          worldId: this.world.data.id,
          mutation_in: ['UPDATED'],
          updatedFields_contains_some: ['gamemode']
        }
      })
      .subscribe({
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

    this.updateSkin()
  }

  updateSkin = () => {
    const pos = this.getCoordinates(3)
    const dir = this.getDirections()

    this.skin.setPosition(pos.x, pos.y, pos.z)
    this.skin.setDirection(dir.dirx, dir.diry)
  }

  updateViewport = () => {
    this.viewport.updateHelmet()
  }

  handleServerUpdate = ({
    player: {
      node: { gamemode }
    }
  }) => {
    this.status.setGamemode(gamemode)
    this.inventory.setGamemode(gamemode)
    this.skin.setGamemode(gamemode)
  }

  saveApollo = () => {
    this.saveAttributes()
  }

  saveAttributes = () => {
    const { prevPos, prevDir } = this.state

    const playerCoords = this.getCoordinates(3)
    const playerCoordsRep = Helpers.get3DCoordsRep(
      playerCoords.x,
      playerCoords.y,
      playerCoords.z
    )

    const playerDir = this.getDirections()
    const playerDirRep = Helpers.get2DCoordsRep(playerDir.dirx, playerDir.diry)
    const playerStatus = this.status.getStatus()

    // eslint-disable-next-line no-restricted-syntax
    for (const member in playerCoords)
      if (playerCoords[member] !== 0 && !playerCoords[member]) return
    // eslint-disable-next-line no-restricted-syntax
    for (const member in playerDir)
      if (playerDir[member] !== 0 && !playerDir[member]) return

    if (playerCoordsRep !== prevPos || playerDirRep !== prevDir) {
      this.setState({ prevPos: playerCoordsRep, prevDir: playerDirRep })

      this.apolloClient.mutate({
        mutation: UPDATE_PLAYER_MUTATION,
        variables: {
          id: this.data.id,
          ...playerCoords,
          ...playerDir,
          ...playerStatus
        }
      })
    }
  }

  removeUpdaters = () => {
    if (this.posSocketUpdater)
      window.clearRequestInterval(this.posSocketUpdater)
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

  getCamPos = () => this.controls.getCamPos()

  getCamCoordinates = dec => this.controls.getNormalizedCamPos(dec)

  getCoordinates = dec => this.controls.getFeetCoords(dec)

  getChunkInfo = () => this.controls.getChunkCoords()

  getDirections = () => this.controls.getDirections()

  getHeight = () => this.getCoordinates().y

  getPosition = () => this.controls.getObject().position

  getObject = () => this.controls.getObject()

  getSkin = () => this.skin

  isDead = () => this.health === HEALTH_MIN

  /* -------------------------------------------------------------------------- */
  /*                                   SETTERS                                  */
  /* -------------------------------------------------------------------------- */
  setPosition = (x, y, z) => this.controls.getObject().position.set(x, y, z)

  setHeight = y => this.controls.getObject().position.setY(y + P_I_2_TOE)
}

export default Player
