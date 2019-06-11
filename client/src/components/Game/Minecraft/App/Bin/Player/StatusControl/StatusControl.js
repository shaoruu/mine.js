import State from './State/State'

class StatusControl {
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

  get isOnGround() {
    return this.state.isOnGround
  }

  get isSprinting() {
    return this.state.isSprinting
  }
}

export default StatusControl
