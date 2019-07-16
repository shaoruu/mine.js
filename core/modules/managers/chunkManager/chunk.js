import Helpers from '../../../utils/helpers'

function Chunk(x, y, z) {
  let mesh = null
  let cbs = {}
  let loading = true
  let isInScene = false
  let data = null

  const rep = Helpers.get3DCoordsRep(x, y, z)

  this.addSelf = scene => scene.add(mesh)

  this.setData = d => (data = d)
  this.setMesh = m => {
    if (!m) return
    mesh = m
    mesh.name = this.getRep()
    mesh.isChunk = true
  }
  this.setCBs = CBs => (cbs = CBs)
  this.setCB = newCB => {
    const { type, x: cbx, y: cby, z: cbz } = newCB

    cbs[Helpers.get3DCoordsRep(cbx, cby, cbz)] = type
  }
  this.setLoading = bool => (loading = bool)
  this.setIsInScene = bool => (isInScene = bool)

  this.getData = () => data
  this.getRep = () => rep
  this.getMesh = () => mesh
  this.getLoading = () => loading
  this.getIsInScene = () => isInScene
}

export default Chunk
