import Helpers from '../../../utils/helpers'

import classes from './inventory.module.css'
import Toolbar from './toolbar/toolbar'

class Inventory {
  constructor(playerId, worldId, container, apolloClient) {
    this.playerId = playerId
    this.worldId = worldId
    this.apolloClient = apolloClient

    this.toolbar = new Toolbar()
    this.initDom(container)
  }

  initDom = container => {
    this.gui = {
      wrapper: document.createElement('div')
    }
    Helpers.applyStyle(this.gui.wrapper, classes.wrapper)

    this.gui.wrapper.appendChild(this.toolbar.getGui())

    container.appendChild(this.gui.wrapper)
  }
}

export default Inventory
