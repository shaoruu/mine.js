import Config from '../../../../config/config'

import * as THREE from 'three'

const DIMENSION = Config.block.dimension
const WATER_COLOR = Config.world.waterColor

const name = 'player-viewport'

function Viewport(player, world, scene) {
  let isChanged = false

  /** MESH SETUP */
  const material = new THREE.MeshBasicMaterial({
    opacity: 0,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false
  })
  const geometry = new THREE.BoxBufferGeometry(DIMENSION / 2, DIMENSION / 2, DIMENSION / 2)
  const helmet = new THREE.Mesh(geometry, material)

  helmet.name = name

  this.setIsChanged = bool => (isChanged = bool)

  this.getPlayer = () => player
  this.getWorld = () => world
  this.getScene = () => scene
  this.getMaterial = () => material
  this.getHelmet = () => helmet
  this.getIsChanged = () => isChanged
}

Viewport.prototype.tick = function() {
  const helmetRef = this.getHelmet()
  const playerRef = this.getPlayer()
  const worldRef = this.getWorld()

  const playerPos = playerRef.getCamCoordinates()

  helmetRef.position.set(playerPos.x * DIMENSION, playerPos.y * DIMENSION, playerPos.z * DIMENSION)

  const coords = playerRef.getCamCoordinates(0)
  const camInType = worldRef.getVoxelByVoxelCoords(coords.x, coords.y, coords.z)

  switch (camInType) {
    case 9:
      if (!this.getIsChanged()) {
        this.addSelf(this.getScene())
        this.setIsChanged(true)
      }

      this.setFilter(WATER_COLOR, 0.3)
      break
    default:
      if (this.getIsChanged()) this.reset()
      break
  }
}

Viewport.prototype.addSelf = function(scene) {
  scene.add(this.getHelmet())
}

Viewport.prototype.setFilter = function(color, opacity) {
  const materialRef = this.getMaterial()
  materialRef.color.set(color)
  materialRef.opacity = opacity
}

Viewport.prototype.resetFilter = function() {
  this.setFilter(0xffffff, 0)
}

Viewport.prototype.reset = function() {
  this.resetFilter()
  this.setIsChanged(false)

  const sceneRef = this.getScene()

  const helmet = sceneRef.getObjectByName(name)
  if (helmet) sceneRef.remove(helmet)
}

export default Viewport
