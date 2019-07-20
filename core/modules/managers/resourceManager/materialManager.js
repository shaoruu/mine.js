import Resources from '../../../config/resources'
import BlockDict from '../../../config/blockDict'

import * as THREE from 'three'

const R_BLOCKS = Resources.textures.blocks

class MaterialManager {
  constructor() {
    this.loader = new THREE.TextureLoader()
    this.materials = {}
  }

  load = () => {
    this.loadBlocks()
  }

  loadBlocks = () => {
    Object.keys(R_BLOCKS).forEach(key => {
      if (!this.materials[key]) this.materials[key] = {}

      const { config } = R_BLOCKS[key]

      ;['top', 'side', 'bottom'].forEach(face => {
        const texture = this.loader.load(R_BLOCKS[key][face])
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.magFilter = THREE.NearestFilter
        texture.minFilter = THREE.NearestMipMapLinearFilter
        // texture.repeat.set(1, 1)

        const side = new THREE.MeshBasicMaterial({
          map: texture,
          vertexColors: THREE.VertexColors,
          ...config
        })

        if (key === '2' && face === 'top') side.color.set(0x6eb219)

        side.name = BlockDict[key].name
        side.tag = BlockDict[key].tag

        this.materials[key][face] = side
      })
    })
  }

  get = (id, face) => this.materials[id][face]
}

export default MaterialManager
