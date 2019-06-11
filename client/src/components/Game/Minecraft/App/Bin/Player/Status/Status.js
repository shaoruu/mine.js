import State from './State/State'

class Status {
  constructor(gamemode, player) {
    this.gamemode = gamemode

    this.player = player

    this.initializeState()
  }

  initializeState = () => {
    let flying = false
    switch (this.gamemode) {
      case 'SURVIVAL':
        flying = false
        break
      case 'CREATIVE':
        flying = true
        break
      case 'SPECTATOR':
        flying = true
        break
      default:
        break
    }

    this.state = new State(flying)
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

  registerSprint = () => (this.state.isSprinting = true)

  registerWalk = () => (this.state.isSprinting = false)

  registerFly = () => (this.state.flying = true)

  toggleFly = () => (this.state.flying = !this.state.flying)

  toggleSprint = () => (this.state.isSprinting = !this.state.isSprinting)

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
}

export default Status
