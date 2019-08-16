import Helpers from '../../../utils/helpers'

import classes from './playerState.module.css'

class PlayerState {
  constructor(gamemode, status, container, resourceManager) {
    const { health, armor, hunger } = status
    this.resourceManager = resourceManager
    this.initDom(container)
    this.updateStatus(health, armor, hunger)
    this.setGamemode(gamemode)
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

  updateStatus = (health, armor, hunger) => {
    this.setHealth(health)
    this.setArmor(armor)
    this.setHunger(hunger)
  }

  /* -------------------------------------------------------------------------- */
  /*                                   SETTERS                                  */
  /* -------------------------------------------------------------------------- */

  setGamemode = gamemode => {
    this.gamemode = gamemode
    this.toggleStatusInterface(this.gamemode)
  }

  toggleStatusInterface = () => {
    let style
    switch (this.gamemode) {
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

  setHealth = health => {
    this.health = health
    const { fullIcons, midIcons } = this.calculateNumberOfIcons(this.health)
    this.generateIcons(fullIcons, midIcons, this.wrapperHeart, 'heart')
  }

  setArmor = armor => {
    this.armor = armor
    const { fullIcons, midIcons } = this.calculateNumberOfIcons(this.armor)
    this.generateIcons(fullIcons, midIcons, this.wrapperArmor, 'armor')
  }

  setHunger = hunger => {
    this.hunger = hunger
    const { fullIcons, midIcons } = this.calculateNumberOfIcons(this.hunger)
    this.generateIcons(fullIcons, midIcons, this.wrapperHunger, 'hunger')
  }

  /* -------------------------------------------------------------------------- */
  /*                                   INTERNAL                                  */
  /* -------------------------------------------------------------------------- */
  calculateNumberOfIcons = value => {
    if (Helpers.isEven(value)) {
      return { fullIcons: value / 2, midIcons: 0 }
    }
    return { fullIcons: Math.trunc(value / 2), midIcons: 1 }
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
}
export default PlayerState
