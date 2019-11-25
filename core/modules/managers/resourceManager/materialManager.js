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
        if (!R_BLOCKS[key][face]) return

        const texture = this.loader.load(R_BLOCKS[key][face])
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.magFilter = THREE.NearestFilter
        texture.minFilter = THREE.NearestMipMapLinearFilter
        texture.repeat.set(1, 1)

        const frontSide = new THREE.MeshLambertMaterial({
          map: texture,
          side: THREE.FrontSide,
          vertexColors: THREE.VertexColors,
          ...config
        })
        const backSide = new THREE.MeshLambertMaterial({
          map: texture,
          side: THREE.BackSide,
          vertexColors: THREE.VertexColors,
          ...config
        })

        const rotatedTexture = this.loader.load(R_BLOCKS[key][face])
        rotatedTexture.wrapS = THREE.RepeatWrapping
        rotatedTexture.wrapT = THREE.RepeatWrapping
        rotatedTexture.magFilter = THREE.NearestFilter
        rotatedTexture.minFilter = THREE.NearestMipMapLinearFilter
        rotatedTexture.repeat.set(1, 1)
        rotatedTexture.center.set(0.5, 0.5)
        rotatedTexture.rotation = -Math.PI / 2

        const frontSideRotated = new THREE.MeshLambertMaterial({
          map: rotatedTexture,
          side: THREE.FrontSide,
          vertexColors: THREE.VertexColors,
          ...config
        })
        const backSideRotated = new THREE.MeshLambertMaterial({
          map: rotatedTexture,
          side: THREE.BackSide,
          vertexColors: THREE.VertexColors,
          ...config
        })

        // if (key === '2' && face === 'top') {
        //   frontSide.color.set(0x6eb219)
        //   frontSideRotated.color.set(0x6eb219)
        // }

        frontSide.name = BlockDict[key].name
        frontSide.tag = BlockDict[key].tag

        frontSideRotated.name = BlockDict[key].name
        frontSideRotated.tag = BlockDict[key].tag

        this.materials[key][face] = {
          frontSide: [frontSide, frontSideRotated],
          backSide: [backSide, backSideRotated]
        }
      })
    })
  }

  get = (id, geoType, face) => {
    if (geoType.includes('p')) {
      if (geoType.includes('2')) return this.materials[id][face].frontSide[1]
      return this.materials[id][face].frontSide[0]
    }
    if (geoType.includes('2')) return this.materials[id][face].backSide[1]
    return this.materials[id][face].backSide[0]
  }
}

export default MaterialManager
