import Config from '../../../../config/config'
import Helpers from '../../../../utils/helpers'

import * as THREE from 'three'

const P_I_2_TOE = Config.player.aabb.eye2toe
const DIMENSION = Config.block.dimension

// https://cdn-images-1.medium.com/max/1400/1*BOwbHOyhLlo7jM_NfoQwEQ.png
function PointerLockControls(player, camera, domElement, initPos, initDirs) {
  const scope = this

  this.domElement = domElement || document.body
  this.isLocked = false

  camera.rotation.set(0, 0, 0)

  const pitchObject = new THREE.Object3D()
  pitchObject.add(camera)

  const yawObject = new THREE.Object3D()
  yawObject.position.set(
    initPos.x * DIMENSION,
    initPos.y * DIMENSION + P_I_2_TOE * DIMENSION,
    initPos.z * DIMENSION
  )
  yawObject.add(pitchObject)

  pitchObject.rotation.x = initDirs.dirx
  yawObject.rotation.y = initDirs.diry

  const PI_2 = Math.PI / 2

  let justChanged = false

  function onMouseMove(event) {
    if (!scope.isLocked) return

    if (justChanged) {
      // Used to avoid glitch on locking/unlocking mouse movements.
      justChanged = false
      return
    }

    const movementX =
      event.movementX || event.mozMovementX || event.webkitMovementX || 0
    const movementY =
      event.movementY || event.mozMovementY || event.webkitMovementY || 0

    yawObject.rotation.y -= movementX * 0.002
    pitchObject.rotation.x -= movementY * 0.002

    pitchObject.rotation.x = Math.max(
      -PI_2,
      Math.min(PI_2, pitchObject.rotation.x)
    )

    player.updateViewport()
  }

  function onPointerlockChange() {
    scope.isLocked = !scope.isLocked

    justChanged = true

    if (document.pointerLockElement !== scope.domElement)
      scope.dispatchEvent({ type: 'unlock' })
  }

  function onPointerlockError() {
    Helpers.error('THREE.PointerLockControls: Unable to use Pointer Lock API')
  }

  this.connect = () => {
    document.addEventListener('mousemove', onMouseMove, false)
    document.addEventListener('pointerlockchange', onPointerlockChange, false)
    document.addEventListener('pointerlockerror', onPointerlockError, false)
  }

  this.disconnect = () => {
    document.removeEventListener('mousemove', onMouseMove, false)
    document.removeEventListener(
      'pointerlockchange',
      onPointerlockChange,
      false
    )
    document.removeEventListener('pointerlockerror', onPointerlockError, false)
  }

  this.dispose = () => {
    this.disconnect()
  }

  this.getObject = () => {
    return yawObject
  }

  this.getPitch = () => {
    return pitchObject
  }

  this.getDirection = (() => {
    // assumes the camera itself is not rotated

    const direction = new THREE.Vector3(0, 0, -1)
    const rotation = new THREE.Euler(0, 0, 0, 'YXZ')

    return v => {
      rotation.set(pitchObject.rotation.x, yawObject.rotation.y, 0)

      v.copy(direction).applyEuler(rotation)

      return v
    }
  })()

  this.lock = () => {
    this.domElement.requestPointerLock()
  }

  this.unlock = () => {
    document.exitPointerLock()
  }

  this.connect()
}

PointerLockControls.prototype = Object.create(THREE.EventDispatcher.prototype)
PointerLockControls.prototype.constructor = PointerLockControls

export default PointerLockControls
