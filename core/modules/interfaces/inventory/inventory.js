import Helpers from '../../../utils/helpers'

import classes from './inventory.module.css'
import Hotbar from './hotbar/hotbar'

class Inventory {
  constructor(playerId, worldId, container, cursor, data, resourceManager) {
    const { hotbar } = this.digestInventory(data)
    this.playerId = playerId
    this.worldId = worldId

    this.hotbar = new Hotbar(cursor, hotbar, resourceManager)
    this.initDom(container)
  }

  initDom = container => {
    this.wrapper = document.createElement('div')

    this.wrapper.appendChild(this.hotbar.getGui())

    Helpers.applyStyle(this.wrapper, classes.wrapper)

    container.appendChild(this.wrapper)
  }

  select = itemBoxId => {
    this.hotbar.select(itemBoxId)
  }

  digestInventory = data => {
    // Default data: "ARMOR:(0;) * 4|BACKPACK:(0,0;) * 27|HOTBAR:(0,0;) * 9"
    const inventory = data.split('|')

    const armor = inventory[0]
      .split(':')[1]
      .split(';')
      .filter(ele => ele)
      .map(ele => parseInt(ele, 0))

    const backpack = inventory[1]
      .split(':')[1]
      .split(';')
      .filter(ele => ele)
      .map(ele => {
        const splitted = ele.split(',').map(e => parseInt(e, 0))
        return { type: splitted[0], count: splitted[1] }
      })

    const hotbar = inventory[2]
      .split(':')[1]
      .split(';')
      .filter(ele => ele)
      .map(ele => {
        const splitted = ele.split(',').map(e => parseInt(e, 0))
        return { type: splitted[0], count: splitted[1] }
      })

    return { armor, backpack, hotbar }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   SETTERS                                  */
  /* -------------------------------------------------------------------------- */
  setGamemode = gamemode => {
    let style
    switch (gamemode) {
      case 'SPECTATOR': {
        style = 'none'
        break
      }
      default: {
        style = 'flex'
        break
      }
    }
    Helpers.applyStyle(this.wrapper, { display: style })
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getHotbar = () => this.hotbar

  getCursor = () => this.cursor

  getHand = () => this.hotbar.getHand()
}

export default Inventory
