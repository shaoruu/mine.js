import Helpers from '../../../../utils/helpers'
import InventoryCommon from '../common/InventoryCommon'

import classes from './hotbar.module.css'

class Hotbar extends InventoryCommon {
  constructor(cursor, data, resourceManager) {
    super(9, resourceManager)

    this.selectedIndex = cursor

    this.initDom(data)
  }

  initDom = data => {
    this.hotbar = document.createElement('div')
    Helpers.applyStyle(this.hotbar, classes.wrapper)

    data.forEach((slot, index) => {
      this.hotbar.appendChild(this.items[index].getUI())

      const { type, count } = slot
      this.items[index].init(type, count)
    })

    this.items[this.selectedIndex].select()
  }

  takeFromHand = amount => {
    this.items[this.selectedIndex].take(amount)
  }

  select = index => {
    this.items[this.selectedIndex].deselect()
    this.items[index].select()
    this.selectedIndex = index
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getGui = () => this.hotbar

  getHand = () => this.items[this.selectedIndex].type
}

export default Hotbar
