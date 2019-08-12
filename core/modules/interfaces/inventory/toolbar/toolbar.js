import Helpers from '../../../../utils/helpers'

import classes from './toolbar.module.css'

class Toolbar {
  constructor() {
    this.items = new Array(9)
    this.itemBoxActive = 1
    this.initDom()
  }

  initDom = () => {
    this.gui = {
      toolbar: document.createElement('div')
    }

    for (let index = 1; index <= this.items.length; index++) {
      const itemBox = document.createElement('div')
      Helpers.applyStyle(itemBox, classes.itemBox)
      if (index === this.itemBoxActive) {
        Helpers.applyStyle(itemBox, classes.itemBoxActive)
      }
      this.gui.toolbar.appendChild(itemBox)
    }

    Helpers.applyStyle(this.gui.toolbar, classes.toolbar)
  }

  setActive = itemBoxId => {
    this.itemBoxActive = itemBoxId
    for (let index = 0; index < this.gui.toolbar.children.length; index++) {
      if (
        this.gui.toolbar.children[index].classList.contains(
          classes.itemBoxActive
        )
      ) {
        Helpers.removeStyle(
          this.gui.toolbar.children[index],
          classes.itemBoxActive
        )
      }
    }
    Helpers.applyStyle(
      this.gui.toolbar.children[itemBoxId - 1],
      classes.itemBoxActive
    )
    // change item in hand here
  }

  getGui = () => this.gui.toolbar
}

export default Toolbar
