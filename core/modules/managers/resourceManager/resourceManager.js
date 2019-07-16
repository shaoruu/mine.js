import MaterialManager from './materialManager'
import TextureManager from './textureManager'
import GeometryManager from './geometryManager'

class ResourceManager {
  constructor() {
    this.matMan = new MaterialManager()
    this.geoMan = new GeometryManager()
    this.texMan = new TextureManager()

    this.matMan.load()
    this.geoMan.load()
    this.texMan.load()
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getMaterial = (id, face) => this.matMan.get(id, face)

  getGeometry = face => this.geoMan.get(face)

  getTexture = (id, face) => this.texMan.get(id, face)
}

export default ResourceManager
