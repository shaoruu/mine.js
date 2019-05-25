import * as THREE from 'three'
import raycast from 'fast-voxel-raycast'

import Config from '../../../Data/Config'
import Helpers from '../../../Utils/Helpers'
import Inventory from './Inventory/Inventory'
import PlayerControls from './Controls/PlayerControls'
import PlayerViewpoint from './Controls/PlayerViewpoint'

const size = Config.chunk.size,
  dimension = Config.block.dimension,
  reachDst = Config.player.reachDst,
  P_I_2_TOE = Config.player.aabb.eye2toe,
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
    this.state = {
      isFlying: true
    }

    this.id = id

    this.mutatePlayer = mutatePlayer

    this.prevTime = performance.now()

    this.velocity = new THREE.Vector3()
    this.acceleration = new THREE.Vector3()

    /** CONNECTIONS TO OUTER SPACE */
    this.scene = scene
    this.camera = camera
    this.world = world
    this.chat = chat

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

    this.chat.addControlListener(this.controls.threeControls)

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
