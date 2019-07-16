import Config from '../../../config/config'

import * as THREE from 'three'

const AMBIENT_LIGHT_COLOR = Config.lights.ambientLight.color
const AMBIENT_LIGHT_INTENSITY = Config.lights.ambientLight.intensity
const AMBIENT_LIGHT_ENABLED = Config.lights.ambientLight.enabled

// Sets up and places all lights in scene
export default class Light {
  constructor(scene) {
    this.scene = scene

    this.init()
  }

  init() {
    this.ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY)
    this.ambientLight.visible = AMBIENT_LIGHT_ENABLED
  }

  place(lightName) {
    switch (lightName) {
      case 'ambient':
        this.scene.add(this.ambientLight)
        break

      default:
        break
    }
  }
}
