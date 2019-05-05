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
	getBlockMat = id => this.blockMatManager.get(id)
	getBlockImg = id => Resources.textures.blocks[id]
	getBlockGeo = key => this.blockGeoManager.get(key)
	getGuiImg = key => Resources.textures.gui[key]
}

export default ResourceManager
