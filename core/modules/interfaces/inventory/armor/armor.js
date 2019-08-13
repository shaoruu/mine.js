import Helpers from '../../../../utils/helpers'

import classes from './armor.module.css'

class Armor {
  constructor(playerData, container, resourceManager) {
    /* Here we need get health and armor from database info
     * Health full + Armor full = 40
     * Mid Health/Mid Armor = 1
     * 1 Health/1 Armor = 2
     */
    const health = 11
    this.resourceManager = resourceManager
    this.initDom(container)
    this.setHealth(health)
  }

  initDom = container => {
    const wrapper = document.createElement('div')
    Helpers.applyStyle(wrapper, classes.wrapper)

    const content = document.createElement('div')
    Helpers.applyStyle(content, classes.wrapperContent)

    this.wrapperArmor = document.createElement('div')
    Helpers.applyStyle(this.wrapperArmor, classes.wrapperRow)
    content.appendChild(this.wrapperArmor)

    this.wrapperHeart = document.createElement('div')
    Helpers.applyStyle(this.wrapperHeart, classes.wrapperRow)
    content.appendChild(this.wrapperHeart)

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
    this.generateHearts(hearts, midHearts)
  }

  generateHearts = (hearts, midHearts) => {
    this.wrapperHeart.innerHTML = ''
    for (let index = 1; index <= 10; index++) {
      const heart = document.createElement('img')
      Helpers.applyStyle(heart, classes.imgHeart)
      if (index <= hearts) {
        heart.src = this.resourceManager.getInterface('heart', 'full')
      } else if (midHearts === 1) {
        heart.src = this.resourceManager.getInterface('heart', 'mid')
        midHearts = 0
      } else {
        heart.src = this.resourceManager.getInterface('heart', 'empty')
      }
      this.wrapperHeart.appendChild(heart)
    }
  }

  isPair = number => {
    if (number % 2 === 0) return true
    return false
  }
}
export default Armor
