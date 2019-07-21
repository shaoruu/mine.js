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
  getMaterial = (id, geo, face) => this.matMan.get(id, geo, face)

  getGeometry = face => this.geoMan.get(face)

  getGeometryWLighting = (face, lighting, smoothLighting, type) =>
    this.geoMan.getWLighting(face, lighting, smoothLighting, type)

  getTexture = (id, face) => this.texMan.get(id, face)
}

export default ResourceManager
