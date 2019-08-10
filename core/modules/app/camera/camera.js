import Config from '../../../config/config'

import * as THREE from 'three'

const CAMERA_CONFIG = Config.camera
const DIMENSION = Config.block.dimension
const SIZE = Config.chunk.size

// Class that creates and updates the main camera
export default class Camera {
  constructor(renderer, RENDER_D) {
    const { width, height } = renderer.domElement

    // Create and position a Perspective Camera
    this.threeCamera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov,
      width / height,
      CAMERA_CONFIG.near,
      (RENDER_D - 1) * SIZE * DIMENSION * 2.5
    )
    this.threeCamera.position.set(
      CAMERA_CONFIG.posX,
      CAMERA_CONFIG.posY,
      CAMERA_CONFIG.posZ
    )

    // Initial sizing
    this.updateSize(renderer)
  }

  updateSize(renderer) {
    // Update camera aspect ratio with window aspect ratio
    this.threeCamera.aspect =
      renderer.domElement.width / renderer.domElement.height

    // Always call updateProjectionMatrix on camera change
    this.threeCamera.updateProjectionMatrix()
  }
}
