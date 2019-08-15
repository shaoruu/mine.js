import Helpers from '../../../utils/helpers'
import Config from '../../../config/config'

import classes from './playerStatus.module.css'

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
const HUNGER_DECREMENT_TIME = Config.player.hunger.hungerDecrementTime
const HUNGER_DECREMENT = Config.player.hunger.hungerDecrement
class PlayerStatus {
  constructor(gamemode, playerData, container, resourceManager) {
    /* Here we need to get health and armor from database info
     * Health full = 20
     * Armor full = 20
     * Hunger full = 20
     * Mid Health/Mid Armor/Mid Hunger = 1
     * 1 Health/1 Armor/1 Hunger = 2
     */
    const { health, armor, hunger } = playerData

    this.health = health
    this.armor = armor
    this.hunger = hunger

    this.gamemode = gamemode

    this.resourceManager = resourceManager
    this.initDom(container)
    this.updateStatus(this.health, this.armor, this.hunger)
    this.setGamemode(this.gamemode)

    this.initAutoStatus()
  }

  initDom = container => {
    this.wrapper = document.createElement('div')
    Helpers.applyStyle(this.wrapper, classes.wrapper)

    const content = document.createElement('div')
    Helpers.applyStyle(content, classes.wrapperContent)

    /* LEFT SECTION */
    const sectionLeft = document.createElement('div')
    Helpers.applyStyle(sectionLeft, classes.section)

    this.wrapperArmor = document.createElement('div')
    Helpers.applyStyle(this.wrapperArmor, classes.wrapperRow)
    sectionLeft.appendChild(this.wrapperArmor)

    this.wrapperHeart = document.createElement('div')
    Helpers.applyStyle(this.wrapperHeart, classes.wrapperRow)
    sectionLeft.appendChild(this.wrapperHeart)

    content.appendChild(sectionLeft)

    /* RIGHT SECTION */
    const sectionRight = document.createElement('div')
    Helpers.applyStyle(sectionRight, classes.section)

    this.wrapperWater = document.createElement('div')
    Helpers.applyStyle(this.wrapperWater, classes.wrapperRowReverse)
    sectionRight.appendChild(this.wrapperWater)

    this.wrapperHunger = document.createElement('div')
    Helpers.applyStyle(this.wrapperHunger, classes.wrapperRowReverse)
    sectionRight.appendChild(this.wrapperHunger)

    content.appendChild(sectionRight)

    this.wrapper.appendChild(content)
    container.appendChild(this.wrapper)
  }

  generateIcons = (icons, midIcons, wrapper, interfaceId) => {
    wrapper.innerHTML = ''
    if (!icons && !midIcons && interfaceId === 'armor') return
    for (let index = 1; index <= 10; index++) {
      const icon = document.createElement('img')
      Helpers.applyStyle(icon, classes.imgIcon)
      if (index <= icons) {
        icon.src = this.resourceManager.getInterface(interfaceId, 'full')
      } else if (midIcons === 1) {
        icon.src = this.resourceManager.getInterface(interfaceId, 'mid')
        midIcons = 0
      } else {
        icon.src = this.resourceManager.getInterface(interfaceId, 'empty')
      }
      wrapper.appendChild(icon)
    }
  }

  updateStatus = (health, armor, hunger) => {
    this.setHealth(health)
    this.setArmor(armor)
    this.setHunger(hunger)
  }

  initAutoStatus = () => {
    this.autoIncrementHealth()
    this.autoDecrementHealth()
    this.autoDecrementHunger()
  }

  autoIncrementHealth = () => {
    window.requestInterval(() => {
      if (
        this.gamemode === 'SURVIVAL' &&
        this.hunger === HUNGER_MAX &&
        this.health < HEALTH_MAX
      )
        this.setHealth(this.health + HEALTH_HUNGER_INCREMENT)
    }, HEALTH_HUNGER_INCREMENT_TIME)
  }

  autoDecrementHealth = () => {
    window.requestInterval(() => {
      if (
        this.gamemode === 'SURVIVAL' &&
        this.hunger === HUNGER_MIN &&
        this.health > HEALTH_MIN
      )
        this.setHealth(this.health - HEALTH_HUNGER_DECREMENT)
    }, HEALTH_HUNGER_DECREMENT_TIME)
  }

  autoDecrementHunger = () => {
    window.requestInterval(() => {
      if (this.gamemode === 'SURVIVAL' && this.hunger > HUNGER_MIN)
        this.setHunger(this.hunger - HUNGER_DECREMENT)
    }, HUNGER_DECREMENT_TIME)
  }

  autoHunger = () => {}

  /* -------------------------------------------------------------------------- */
  /*                                   SETTERS                                  */
  /* -------------------------------------------------------------------------- */
  setHealth = health => {
    if (health > HEALTH_MIN) {
      if (health < HEALTH_MAX) {
        this.health = health
      } else {
        this.health = HEALTH_MAX
      }
    } else {
      this.health = 0
    }
    let hearts = 0
    let midHearts = 0
    if (Helpers.isEven(this.health)) {
      hearts = this.health / 2
      midHearts = 0
    } else {
      hearts = Math.trunc(this.health / 2)
      midHearts = 1
    }
    this.generateIcons(hearts, midHearts, this.wrapperHeart, 'heart')
  }

  setArmor = armor => {
    if (armor > ARMOR_MIN) {
      if (armor < ARMOR_MAX) {
        this.armor = armor
      } else {
        this.armor = ARMOR_MAX
      }
    } else {
      this.armor = 0
    }
    let armors = 0
    let midArmors = 0
    if (Helpers.isEven(armor)) {
      armors = armor / 2
      midArmors = 0
    } else {
      armors = Math.trunc(armor / 2)
      midArmors = 1
    }
    this.generateIcons(armors, midArmors, this.wrapperArmor, 'armor')
  }

  setHunger = hunger => {
    if (hunger > HUNGER_MIN) {
      if (hunger < HUNGER_MAX) {
        this.hunger = hunger
      } else {
        this.hunger = HUNGER_MAX
      }
    } else {
      this.hunger = 0
    }
    let hungers = 0
    let midHungers = 0
    if (Helpers.isEven(hunger)) {
      hungers = hunger / 2
      midHungers = 0
    } else {
      hungers = Math.trunc(hunger / 2)
      midHungers = 1
    }
    this.generateIcons(hungers, midHungers, this.wrapperHunger, 'hunger')
  }

  setGamemode = gamemode => {
    this.gamemode = gamemode
    let style
    switch (gamemode) {
      case 'SURVIVAL': {
        style = 'flex'
        break
      }
      default: {
        style = 'none'
        break
      }
    }
    Helpers.applyStyle(this.wrapper, { display: style })
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
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
}
export default PlayerStatus
