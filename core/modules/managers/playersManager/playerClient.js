import Config from '../../../config/config'

import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'

const DIMENSION = Config.block.dimension

function PlayerClient(username, pos, dir) {
  const tempGeo = new THREE.BoxBufferGeometry(DIMENSION, DIMENSION, DIMENSION)
  const tempMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  const tempMesh = new THREE.Mesh(tempGeo, tempMat)

  tempMesh.position.copy(pos.multiplyScalar(DIMENSION))

  this.getUsername = () => username
  this.getPosition = () => tempMesh.position
  this.getDirection = () => dir
  this.getMesh = () => tempMesh
}

PlayerClient.prototype.addSelf = function(scene) {
  scene.add(this.getMesh())
}

PlayerClient.prototype.update = function(x, y, z, dirx, diry) {
  const meshRef = this.getMesh()
  new TWEEN.Tween(meshRef.position)
    .to({ x: x * DIMENSION, y: y * DIMENSION, z: z * DIMENSION }, 100)
    .start()
  new TWEEN.Tween(meshRef.rotation).to({ x: dirx, y: diry, z: meshRef.rotation.z }, 100).start()
}

export default PlayerClient
