import Helpers from '../../../../utils/helpers'

import classes from './toolbar.module.css'

class Toolbar {
  constructor() {
    this.initDom()
  }

  initDom = () => {
    this.gui = {
      toolbar: document.createElement('div')
    }

    for (let index = 0; index < 9; index++) {
      const item = document.createElement('div')
      Helpers.applyStyle(item, classes.item)
      this.gui.toolbar.appendChild(item)
    }

    Helpers.applyStyle(this.gui.toolbar, classes.toolbar)
  }

  getGui = () => this.gui.toolbar
}

export default Toolbar
