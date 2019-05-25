/**
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 */

import * as THREE from 'three'

import Config from '../../../../Data/Config'

const size = Config.block.dimension,
  P_I_2_TOE = Config.player.aabb.eye2toe,
  DIMENSION = Config.block.dimension

const PointerLockControls = function(camera, domElement, initPos, initDirs) {
  let scope = this

  this.domElement = domElement || document.body
  this.isLocked = false

  camera.rotation.set(0, 0, 0)

  let pitchObject = new THREE.Object3D()
  pitchObject.add(camera)

  let yawObject = new THREE.Object3D()
  yawObject.position.set(
    initPos.x * size,
    initPos.y * size + P_I_2_TOE * DIMENSION,
    initPos.z * size
  )
  yawObject.add(pitchObject)

  pitchObject.rotation.x = initDirs.dirx
  yawObject.rotation.y = initDirs.diry

  let PI_2 = Math.PI / 2

  function onMouseMove(event) {
    if (!scope.isLocked) return

    let movementX =
      event.movementX || event.mozMovementX || event.webkitMovementX || 0
    let movementY =
      event.movementY || event.mozMovementY || event.webkitMovementY || 0

    yawObject.rotation.y -= movementX * 0.002
    pitchObject.rotation.x -= movementY * 0.002

    pitchObject.rotation.x = Math.max(
      -PI_2,
      Math.min(PI_2, pitchObject.rotation.x)
    )
  }

  function onPointerlockChange() {
    scope.isLocked = !scope.isLocked

    if (document.pointerLockElement !== scope.domElement)
      scope.dispatchEvent({ type: 'unlock' })
  }

  function onPointerlockError() {
    console.error('THREE.PointerLockControls: Unable to use Pointer Lock API')
  }

  this.connect = function() {
    document.addEventListener('mousemove', onMouseMove, false)
    document.addEventListener('pointerlockchange', onPointerlockChange, false)
    document.addEventListener('pointerlockerror', onPointerlockError, false)
  }

  this.disconnect = function() {
    document.removeEventListener('mousemove', onMouseMove, false)
    document.removeEventListener(
      'pointerlockchange',
      onPointerlockChange,
      false
    )
    document.removeEventListener('pointerlockerror', onPointerlockError, false)
  }

  this.dispose = function() {
    this.disconnect()
  }

  this.getObject = function() {
    return yawObject
  }

  this.getPitch = function() {
    return pitchObject
  }

  this.getDirection = (function() {
    // assumes the camera itself is not rotated

    let direction = new THREE.Vector3(0, 0, -1)
    let rotation = new THREE.Euler(0, 0, 0, 'YXZ')

    return function(v) {
      rotation.set(pitchObject.rotation.x, yawObject.rotation.y, 0)

      v.copy(direction).applyEuler(rotation)

      return v
    }
  })()

  this.lock = function() {
    this.domElement.requestPointerLock()
  }

  this.unlock = function() {
    document.exitPointerLock()
  }

  this.connect()
}

PointerLockControls.prototype = Object.create(THREE.EventDispatcher.prototype)
PointerLockControls.prototype.constructor = PointerLockControls

export default PointerLockControls
