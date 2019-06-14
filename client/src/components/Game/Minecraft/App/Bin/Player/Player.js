import Config from '../../../Data/Config'
import Inventory from './Inventory/Inventory'
import PlayerControls from './Controls/Controls'
import PlayerViewport from './Controls/Viewport'
import Status from './Status/Status'

const P_I_2_TOE = Config.player.aabb.eye2toe,
  COORD_DEC = Config.player.coordinateDec

export default class Player {
  constructor(
    playerData,
    camera,
    scene,
    world,
    container,
    blocker,
    button,
    initPos,
    initDirs,
    resourceManager,
    { cursor, data },
    mutatePlayer,
    chat
  ) {
    const { id, gamemode } = playerData

    this.id = id

    this.mutatePlayer = mutatePlayer

    this.status = new Status(gamemode, this)

    // Control center
    this.controls = new PlayerControls(
      this,
      this.status,
      world,
      chat,
      camera,
      container,
      blocker,
      button,
      initPos,
      initDirs
    )
    if (!this.status.isSpectator) {
      this.viewport = new PlayerViewport(
        scene,
        camera,
        this.controls,
        world,
        resourceManager
      )
      this.controls.registerViewport(this.viewport)
    }

    this.inventory = new Inventory(
      container,
      resourceManager,
      cursor,
      data,
      this.mutateSelf
    )

    scene.add(this.controls.getObject())
  }

  update = () => {
    this.controls.tick()

    if (!this.status.isSpectator) this.viewport.updateTPBlocks()
  }

  getCoordinates = (dec = COORD_DEC) => {
    // This is essentially where the foot of the player is
    const camPos = this.controls.getNormalizedCamPos(dec)
    camPos.y -= P_I_2_TOE
    return camPos
  }
  getDirections = () => this.controls.getDirections()

  mutateSelf = obj => {
    this.mutatePlayer({
      variables: {
        id: this.id,
        ...obj
      }
    })
  }

  // Add item to inventory
  obtain = (type, count) => {
    // TODO: implement if inventory is full
    this.inventory.add(type, count)
  }
  // Remove item from hand
  takeFromHand = amount => {
    this.inventory.takeFromHand(amount)
  }
}
