import MaterialManager from './materialManager'
import TextureManager from './textureManager'
import GeometryManager from './geometryManager'
import InterfaceManager from './interfaceManager'

class ResourceManager {
  constructor() {
    this.matMan = new MaterialManager()
    this.geoMan = new GeometryManager()
    this.texMan = new TextureManager()
    this.intMan = new InterfaceManager()

    this.matMan.load()
    this.geoMan.load()
    this.texMan.load()
    this.intMan.load()
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */
  getMaterial = (id, geo, face) => this.matMan.get(id, geo, face)

  getGeometry = face => this.geoMan.get(face)

  getGeometryWLighting = (face, lighting, smoothLighting, type) =>
    this.geoMan.getWLighting(face, lighting, smoothLighting, type)

  getTexture = (id, face) => this.texMan.get(id, face)

  getInterface = (id, type) => this.intMan.get(id, type)
}

export default ResourceManager
