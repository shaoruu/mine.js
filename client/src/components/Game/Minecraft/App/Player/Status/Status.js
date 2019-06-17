import TWEEN from '@tweenjs/tween.js'

import State from './State/State'
import Config from '../../../Data/Config'

const SPRINT_FOV_DELTA = Config.camera.sprintFovDelta,
  REGULAR_FOV = Config.camera.fov,
  SPECTATOR_FOV = Config.camera.spectatorFov

class Status {
  constructor(gamemode, player) {
    this.gamemode = gamemode

    this.player = player

    this.initializeState()
  }

  initializeState = () => {
    let flying = false
    let FOV = REGULAR_FOV
    switch (this.gamemode) {
      case 'SURVIVAL':
        flying = false
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

    this.state = new State(flying)
    this._tweenCameraFOV(FOV)
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

    this._tweenCameraFOV(this.gamemodeFOV + SPRINT_FOV_DELTA)
  }

  registerWalk = () => {
    this.state.isSprinting = false

    this._tweenCameraFOV(this.gamemodeFOV, 100)
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

  _tweenCameraFOV = (fov, time = 200) => {
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
