import * as THREE from 'three'

import Resources from '../Resources'

class BlockMaterialManager {
  constructor() {
    this.loader = new THREE.TextureLoader()

    this.materials = {}
    this.images = {}
  }

  load = () => {
    for (let key in Resources.textures.blocks) {
      this.images[key] = {}
      this.materials[key] = {}

      const sources = Resources.textures.blocks[key]

      for (let keyword in sources) {
        const texture = this.loader.load(sources[keyword])
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.magFilter = THREE.NearestFilter
        texture.minFilter = THREE.NearestMipMapLinearFilter

        var material = new THREE.MeshLambertMaterial({
          map: texture,
          side: THREE.DoubleSide
        })

        if (key === '2' && keyword === 'top') material.color.setHex(0x93e074)

        this.images[key][keyword] = sources[keyword]
        this.materials[key][keyword] = material
      }
    }
  }

  get = id => this.materials[id]
  getImage = id => this.images[id]
}

export default BlockMaterialManager
