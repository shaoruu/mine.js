import Helpers from '../../../utils/helpers'

import classes from './playerStatus.module.css'

class PlayerStatus {
  constructor(playerData, container, resourceManager) {
    /* Here we need get health and armor from database info
     * Health full = 20
     * Armor full = 20
     * Hungry full = 20
     * Mid Health/Mid Armor/Mid Hungry = 1
     * 1 Health/1 Armor/1 Hungry = 2
     */
    const health = 11
    const armor = 16
    const hungry = 14
    this.resourceManager = resourceManager
    this.initDom(container)
    this.setHealth(health)
    this.setArmor(armor)
    this.setHungry(hungry)
  }

  initDom = container => {
    const wrapper = document.createElement('div')
    Helpers.applyStyle(wrapper, classes.wrapper)

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

    this.wrapperHungry = document.createElement('div')
    Helpers.applyStyle(this.wrapperHungry, classes.wrapperRowReverse)
    sectionRight.appendChild(this.wrapperHungry)

    content.appendChild(sectionRight)

    wrapper.appendChild(content)
    container.appendChild(wrapper)
  }

  setHealth = health => {
    let hearts = 0
    let midHearts = 0
    if (this.isPair(health)) {
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
    if (this.isPair(armor)) {
      armors = armor / 2
      midArmors = 0
    } else {
      armors = Math.trunc(armor / 2)
      midArmors = 1
    }
    this.generateIcons(armors, midArmors, this.wrapperArmor, 'armor')
  }

  setHungry = hungry => {
    let hungrys = 0
    let midHungrys = 0
    if (this.isPair(hungry)) {
      hungrys = hungry / 2
      midHungrys = 0
    } else {
      hungrys = Math.trunc(hungry / 2)
      midHungrys = 1
    }
    this.generateIcons(hungrys, midHungrys, this.wrapperHungry, 'hungry')
  }

  generateIcons = (icons, midIcons, wrapper, interfaceId) => {
    wrapper.innerHTML = ''
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

  isPair = number => {
    if (number % 2 === 0) return true
    return false
  }
}
export default PlayerStatus
