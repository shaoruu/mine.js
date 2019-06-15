import * as THREE from 'three'

import Resources from '../Resources'

class BlockMaterialManager {
  constructor() {
    this.loader = new THREE.TextureLoader()

    this.materials = {}
    this.images = {}
  }

  load = () => {
    this.loadRegularBlocks()
    this.loadSpecialBlocks()
  }

  loadRegularBlocks = () => {
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

        const frontSide = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.FrontSide
          }),
          backSide = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.BackSide
          })

        if (key === '2' && keyword === 'top') frontSide.color.setHex(0x93e074)

        this.images[key][keyword] = sources[keyword]
        this.materials[key][keyword] = {
          frontSide,
          backSide
        }
      }
    }
  }

  loadSpecialBlocks = () => {
    for (let key in Resources.textures.specialBlocks) {
      this.images[key] = {}
      this.materials[key] = {}

      const sources = Resources.textures.specialBlocks[key]

      for (let keyword in sources) {
        const texture = this.loader.load(sources[keyword])
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.magFilter = THREE.NearestFilter
        texture.minFilter = THREE.NearestMipMapLinearFilter

        const material = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide
        })

        this.images[key][keyword] = sources[keyword]
        this.materials[key][keyword] = material
      }
    }
  }

  get = (id, geoType, material) => {
    if (geoType.includes('p')) return this.materials[id][material].frontSide
    return this.materials[id][material].backSide
  }
  getSpecial = id => this.materials[id]
  getImage = id => this.images[id]
}

export default BlockMaterialManager
