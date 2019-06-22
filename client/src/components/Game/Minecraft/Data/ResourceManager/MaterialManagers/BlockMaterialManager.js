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
        texture.repeat.set(1, 1)

        const frontSide = new THREE.MeshLambertMaterial({
          map: texture,
          side: THREE.FrontSide,
          vertexColors: THREE.VertexColors
        }),
          backSide = new THREE.MeshLambertMaterial({
            map: texture,
            side: THREE.BackSide,
            vertexColors: THREE.VertexColors
          })

        const rotatedTexture = this.loader.load(sources[keyword])
        rotatedTexture.wrapS = THREE.RepeatWrapping
        rotatedTexture.wrapT = THREE.RepeatWrapping
        rotatedTexture.magFilter = THREE.NearestFilter
        rotatedTexture.minFilter = THREE.NearestMipMapLinearFilter
        rotatedTexture.repeat.set(1, 1)
        rotatedTexture.center.set(0.5, 0.5)
        rotatedTexture.rotation = -Math.PI / 2

        // console.log(texture, rotatedTexture)

        const frontSideRotated = new THREE.MeshLambertMaterial({
          map: rotatedTexture,
          side: THREE.FrontSide,
          vertexColors: THREE.VertexColors
        }),
          backSideRotated = new THREE.MeshLambertMaterial({
            map: rotatedTexture,
            side: THREE.BackSide,
            vertexColors: THREE.VertexColors
          })

        if (key === '2' && keyword === 'top') {
          frontSide.color.setHex(0x93e074)
          frontSideRotated.color.setHex(0x93e074)
        }

        this.images[key][keyword] = sources[keyword]
        this.materials[key][keyword] = {
          frontSide: [frontSide, frontSideRotated],
          backSide: [backSide, backSideRotated]
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

        const material = new THREE.MeshLambertMaterial({
          map: texture,
          side: THREE.DoubleSide,
          vertexColors: THREE.VertexColors
        })

        this.images[key][keyword] = sources[keyword]
        this.materials[key][keyword] = material
      }
    }
  }

  get = (id, geoType, material) => {
    if (geoType.includes('p')) {
      if (geoType.includes('2')) {
        return this.materials[id][material].frontSide[1]
      } else {
        return this.materials[id][material].frontSide[0]
      }

    } else {
      if (geoType.includes('2')) {
        return this.materials[id][material].backSide[1]
      } else {
        return this.materials[id][material].backSide[0]
      }
    }

  }
  getSpecial = id => this.materials[id]
  getImage = id => this.images[id]
}

export default BlockMaterialManager
