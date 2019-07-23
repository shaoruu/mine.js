import Config from '../../../config/config'

import * as THREE from 'three'

const CAMERA_CONFIG = Config.camera
const DIMENSION = Config.block.dimension
const SIZE = Config.chunk.size
const HORZ_D = Config.player.render.horzD
const VERT_D = Config.player.render.vertD

// Class that creates and updates the main camera
export default class Camera {
  constructor(renderer) {
    const { width, height } = renderer.domElement

    const D = HORZ_D > VERT_D ? VERT_D : HORZ_D

    // Create and position a Perspective Camera
    this.threeCamera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov,
      width / height,
      CAMERA_CONFIG.near,
      D * SIZE * DIMENSION * 2
    )
    this.threeCamera.position.set(CAMERA_CONFIG.posX, CAMERA_CONFIG.posY, CAMERA_CONFIG.posZ)

    // Initial sizing
    this.updateSize(renderer)
  }

  updateSize(renderer) {
    // Update camera aspect ratio with window aspect ratio
    this.threeCamera.aspect = renderer.domElement.width / renderer.domElement.height

    // Always call updateProjectionMatrix on camera change
    this.threeCamera.updateProjectionMatrix()
  }
}
