/**
 * Central control of player state
 */
import Config from '../../../../config/config'
import Stateful from '../../../../lib/stateful/stateful'

import TWEEN from '@tweenjs/tween.js'

const SPRINT_FOV_DELTA = Config.camera.sprintFovDelta
const REGULAR_FOV = Config.camera.fov
const SPECTATOR_FOV = Config.camera.spectatorFov

class Status extends Stateful {
  constructor(gamemode, player) {
    super({
      flying: true,
      hasJumped: false,
      isOnGround: true,
      isSprinting: false
    })

    this.gamemode = gamemode

    this.player = player

    this.initializeState()
  }

  initializeState = () => {
    let flying = false
    let FOV = REGULAR_FOV

    this.player.freshlyJumped = false

    switch (this.gamemode) {
      case 'SURVIVAL':
        break
      case 'CREATIVE':
        flying = true
        break
      case 'SPECTATOR':
        flying = true
        FOV = SPECTATOR_FOV
        break
      default:
        break
    }

    this.setState({ flying })
    this.tweenCameraFOV(FOV)
  }

  tick = () => {
    TWEEN.update()
  }

  registerJump = () => {
    this.state.hasJumped = true
    this.state.isOnGround = false
  }

  registerLand = () => {
    this.state.flying = false
    this.state.hasJumped = false
    this.state.isOnGround = true
  }

  registerSprint = () => {
    this.state.isSprinting = true

    this.tweenCameraFOV(this.gamemodeFOV + SPRINT_FOV_DELTA)
  }

  registerWalk = () => {
    this.state.isSprinting = false

    this.tweenCameraFOV(this.gamemodeFOV)
  }

  registerFly = () => (this.state.flying = true)

  toggleFly = () => (this.state.flying = !this.state.flying)

  toggleSprint = () => (this.state.isSprinting = !this.state.isSprinting)

  setGamemode = gamemode => {
    this.gamemode = gamemode
    this.initializeState()
  }

  get shouldFriction() {
    return !this.state.flying || !this.state.hasJumped
  }

  get isFlying() {
    return this.state.flying
  }

  get shouldGravity() {
    return !this.state.flying
  }

  get canJump() {
    return !this.state.hasJumped
  }

  get canFly() {
    return this.gamemode === 'CREATIVE' || this.gamemode === 'SPECTATOR'
  }

  get isOnGround() {
    return this.state.isOnGround
  }

  get isSprinting() {
    return this.state.isSprinting
  }

  get isSurvival() {
    return this.gamemode === 'SURVIVAL'
  }

  get isCreative() {
    return this.gamemode === 'CREATIVE'
  }

  get isSpectator() {
    return this.gamemode === 'SPECTATOR'
  }

  get gamemodeFOV() {
    return this.isSpectator ? SPECTATOR_FOV : REGULAR_FOV
  }

  get isSneaking() {
    return !this.state.flying && this.player.controls.movements.down
  }

  get isSneakingOnGround() {
    return (
      !this.state.flying &&
      this.state.isOnGround &&
      this.player.controls.movements.down
    )
  }

  tweenCameraFOV = (fov, time = 200) => {
    const fovObj = { fov: this.player.camera.fov }

    const sprintTween = new TWEEN.Tween(fovObj).to({ fov }, time)
    sprintTween.onUpdate(() => {
      this.player.camera.fov = fovObj.fov
      this.player.camera.updateProjectionMatrix()
    })
    sprintTween.start()
  }
}

export default Status
