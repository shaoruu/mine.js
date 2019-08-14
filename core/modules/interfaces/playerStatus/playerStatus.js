import Helpers from '../../../utils/helpers'

import classes from './playerStatus.module.css'

class PlayerStatus {
  constructor(gamemode, playerData, container, resourceManager) {
    /* Here we need to get health and armor from database info
     * Health full = 20
     * Armor full = 20
     * Hunger full = 20
     * Mid Health/Mid Armor/Mid Hunger = 1
     * 1 Health/1 Armor/1 Hunger = 2
     */

    //! Temporary Data
    const health = 11
    const armor = 6
    const hunger = 14

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

  /* -------------------------------------------------------------------------- */
  /*                                   SETTERS                                  */
  /* -------------------------------------------------------------------------- */
  setHealth = health => {
    let hearts = 0
    let midHearts = 0
    if (Helpers.isEven(health)) {
      hearts = health / 2
      midHearts = 0
    } else {
      hearts = Math.trunc(health / 2)
      midHearts = 1
    }
    this.generateIcons(hearts, midHearts, this.wrapperHeart, 'heart')
  }

  setArmor = armor => {
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
}
export default PlayerStatus
