import BlockMaterialManager from './MaterialManagers/BlockMaterialManager'
import BlockGeometryManager from './GeometryManagers/BlockGeometryManager'
import Resources from './Resources'

class ResourceManager {
  constructor() {
    // Material Loaders
    this.blockMatManager = new BlockMaterialManager()

    // Geometry Loaders
    this.blockGeoManager = new BlockGeometryManager()
  }

  initialize = () => {
    this.blockMatManager.load()
    this.blockGeoManager.load()
  }

  // Getters
  getBlockMat = (id, geoType, material) => this.blockMatManager.get(id, geoType, material)
  getSpecialBlockMat = id => this.blockMatManager.getSpecial(id)
  getBlockImg = id => Resources.textures.blocks[id]
  getBlockGeo = key => this.blockGeoManager.get(key)
  getBlockGeoWLighting = (key, lighting, smoothLighting) =>
    this.blockGeoManager.getWLighting(key, lighting, smoothLighting)
  getGuiImg = key => Resources.textures.gui[key]
}

export default ResourceManager
