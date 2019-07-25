import * as THREE from 'three'

// Main webGL renderer class
export default class Renderer {
  constructor(scene, canvas) {
    // Properties
    this.scene = scene
    this.canvas = canvas

    // Create WebGL renderer and set its antialias
    this.threeRenderer = new THREE.WebGLRenderer({ antialias: false, canvas: this.canvas })

    // Set clear color to fog to enable fog or to hex color for no fog
    this.threeRenderer.setClearColor(scene.fog.color)
    this.threeRenderer.setPixelRatio(window.devicePixelRatio) // For retina
    this.threeRenderer.setSize(canvas.clientWidth, canvas.clientHeight, false)

    // Get anisotropy for textures
    // Config.maxAnisotropy = this.threeRenderer.capabilities.getMaxAnisotropy()

    // Initial size update set to canvas container
    this.updateSize()

    // Listeners
    document.addEventListener('DOMContentLoaded', this.updateSize, false)
  }

  updateSize() {
    this.threeRenderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false)
  }

  render(scene, camera) {
    // Renders scene to canvas target
    this.threeRenderer.render(scene, camera)
  }
}
