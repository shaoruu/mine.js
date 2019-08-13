import Resources from '../../../config/resources'

class InterfaceManager {
  constructor() {
    this.icons = {}
  }

  load = () => {
    this.loadIcons()
  }

  loadIcons = () => {
    this.icons = Resources.interface.armor
  }

  get = (id, type) => this.icons[id][type]
}

export default InterfaceManager
