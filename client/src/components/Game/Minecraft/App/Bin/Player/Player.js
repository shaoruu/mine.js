import Config from '../../../Data/Config'
import Inventory from './Inventory/Inventory'
import PlayerControls from './Controls/Controls'
import PlayerViewpoint from './Controls/Viewport'

const P_I_2_TOE = Config.player.aabb.eye2toe,
  COORD_DEC = Config.player.coordinateDec

export default class Player {
  constructor(
    id,
    camera,
    scene,
    world,
    container,
    blocker,
    initPos,
    initDirs,
    resourceManager,
    { cursor, data },
    mutatePlayer,
    chat
  ) {
    this.id = id

    this.mutatePlayer = mutatePlayer

    // Control center
    this.controls = new PlayerControls(
      this,
      world,
      chat,
      camera,
      container,
      blocker,
      initPos,
      initDirs
    )
    this.viewpoint = new PlayerViewpoint(scene, camera, this.controls, world)

    this.inventory = new Inventory(
      container,
      resourceManager,
      cursor,
      data,
      this.mutateSelf
    )

    chat.addControlListener(this.controls.threeControls)
    scene.add(this.controls.getObject())
  }

  update = () => {
    this.controls.tick()
    this.viewpoint.updateTPBlocks()
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
