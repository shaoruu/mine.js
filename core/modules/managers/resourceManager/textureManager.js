import Resources from '../../../config/resources'

class TextureManager {
  constructor() {
    this.textures = {}
  }

  load = () => {
    this.loadBlocks()
  }

  loadBlocks = () => {
    this.textures = Resources.textures.blocks
  }

  get = (id, face) => this.textures[id][face]
}

export default TextureManager
