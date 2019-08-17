/**
 * Central control of player state
 */
import Config from '../../../../config/config'
import Stateful from '../../../../lib/stateful/stateful'
import { PlayerState } from '../../../interfaces'

import TWEEN from '@tweenjs/tween.js'

const SPRINT_FOV_DELTA = Config.camera.sprintFovDelta
const REGULAR_FOV = Config.camera.fov
const SPECTATOR_FOV = Config.camera.spectatorFov

const HEALTH_MAX = Config.player.health.max
const HEALTH_MIN = Config.player.health.min
const HUNGER_MAX = Config.player.hunger.max
const HUNGER_MIN = Config.player.hunger.min
const ARMOR_MAX = Config.player.armor.max
const ARMOR_MIN = Config.player.armor.min

const HEALTH_HUNGER_INCREMENT_TIME = Config.player.health.hungerIncrementTime
const HEALTH_HUNGER_INCREMENT = Config.player.health.hungerIncrement
const HEALTH_HUNGER_DECREMENT_TIME = Config.player.health.hungerDecrementTime
const HEALTH_HUNGER_DECREMENT = Config.player.health.hungerDecrement
const HUNGER_HEART_MIN = Config.player.health.hungerMin
const HUNGER_DECREMENT_TIME = Config.player.hunger.hungerDecrementTime
const HUNGER_DECREMENT = Config.player.hunger.hungerDecrement
const HUNGER_SLOW_WALK = Config.player.hunger.slowWalk

class Status extends Stateful {
  constructor(player, playerData, container, resourceManager) {
    super({
      flying: true,
      hasJumped: false,
      isOnGround: true,
      isSprinting: false,
      diving: false
    })
    this.player = player

    const { health, armor, hunger, gamemode } = playerData

    /* STATUS INFOS
     * Health full = 20
     * Armor full = 20
     * Hunger full = 20
     * Mid icon Health/Mid icon Armor/Mid icon Hunger = 1
     * 1 icon Health/1 icon Armor/1 icon Hunger = 2
     */

    this.interface = new PlayerState(
      gamemode,
      this.getStatus(),
      container,
      resourceManager
    )

    this.setHealth(health)
    this.setArmor(armor)
    this.setHunger(hunger)

    this.setGamemode(gamemode)

    this.initializeStates()
    this.initAutoStatus()
  }

  /* -------------------------------------------------------------------------- */
  /*                                   INITIERS                                */
  /* -------------------------------------------------------------------------- */
  initializeStates = () => {
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

  /* -------------------------------------------------------------------------- */
  /*                                   REGISTERS                                */
  /* -------------------------------------------------------------------------- */
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

  setDiving = diving => (this.state.diving = diving)

  toggleDiving = () => (this.state.diving = !this.state.diving)

  toggleFly = () => (this.state.flying = !this.state.flying)

  toggleSprint = () => (this.state.isSprinting = !this.state.isSprinting)

  /* -------------------------------------------------------------------------- */
  /*                                   SETTERS                                  */
  /* -------------------------------------------------------------------------- */
  setHealth = health => {
    this.health = this.checkValueIfMinAndMaxIsValid(
      health,
      HEALTH_MIN,
      HEALTH_MIN,
      HEALTH_MAX
    )
    this.interface.setHealth(this.health)
  }

  setArmor = armor => {
    this.armor = this.checkValueIfMinAndMaxIsValid(
      armor,
      ARMOR_MIN,
      ARMOR_MIN,
      ARMOR_MAX
    )
    this.interface.setArmor(this.armor)
  }

  setHunger = hunger => {
    this.hunger = this.checkValueIfMinAndMaxIsValid(
      hunger,
      HUNGER_MIN,
      HUNGER_MIN,
      HUNGER_MAX
    )
    this.interface.setHunger(this.hunger)
  }

  setGamemode = gamemode => {
    this.gamemode = gamemode
    this.initializeStates()
    this.interface.setGamemode(gamemode)
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  get shouldFriction() {
    return !this.state.flying || !this.state.hasJumped
  }

  get isFlying() {
    return this.state.flying
  }

  get isDiving() {
    return this.state.diving
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

  get isHungry() {
    return this.isSurvival && this.hunger <= HUNGER_SLOW_WALK
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

  getHealth = () => this.health

  getArmor = () => this.armor

  getHunger = () => this.hunger

  getStatus = () => {
    return {
      health: this.health,
      armor: this.armor,
      hunger: this.hunger
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   INTERNALS                                */
  /* -------------------------------------------------------------------------- */
  checkValueIfMinAndMaxIsValid = (value, valueInvalid, min, max) => {
    if (value > min) {
      if (value < max) {
        return value
      }
      return max
    }
    return valueInvalid
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

  /* -------------------------------------------------------------------------- */
  /*                                   AUTOCALCULATES                           */
  /* -------------------------------------------------------------------------- */
  initAutoStatus = () => {
    this.autoIncrementHealth()
    this.autoDecrementHealth()
    this.autoDecrementHunger()
  }

  autoIncrementHealth = () => {
    this.healthIncr = window.requestInterval(() => {
      if (
        this.gamemode === 'SURVIVAL' &&
        this.hunger === HUNGER_MAX &&
        this.health < HEALTH_MAX
      )
        this.setHealth(this.health + HEALTH_HUNGER_INCREMENT)
    }, HEALTH_HUNGER_INCREMENT_TIME)
  }

  autoDecrementHealth = () => {
    this.healthDecr = window.requestInterval(() => {
      if (
        this.gamemode === 'SURVIVAL' &&
        this.hunger === HUNGER_MIN &&
        this.health > HUNGER_HEART_MIN
      )
        this.setHealth(this.health - HEALTH_HUNGER_DECREMENT)
    }, HEALTH_HUNGER_DECREMENT_TIME)
  }

  autoDecrementHunger = () => {
    this.hungerDecr = window.requestInterval(() => {
      if (this.gamemode === 'SURVIVAL' && this.hunger > HUNGER_MIN) {
        this.setHunger(this.hunger - HUNGER_DECREMENT)
        if (this.hunger <= HUNGER_SLOW_WALK && this.player.status.isSprinting)
          this.player.status.registerWalk()
      }
    }, HUNGER_DECREMENT_TIME)
  }

  autoHunger = () => {}
}

export default Status
