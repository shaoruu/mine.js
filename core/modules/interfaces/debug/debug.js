/**
 * F3 utilities
 */
import Helpers from '../../../utils/helpers'

import classes from './debug.module.css'

function Debug(container, player, world) {
  this.player = player
  this.world = world

  let display = process.env.NODE_ENV === 'development'

  let maxFPS = null
  let minFPS = null

  const wrapper = document.createElement('div')
  const leftPanel = document.createElement('div')
  const rightPanel = document.createElement('div')
  const title = document.createElement('p')
  const coordinates = document.createElement('p')
  const fps = document.createElement('p')

  // DEFAULTS
  title.innerHTML = 'Minecraft JS (dev/beta/vanilla)'
  coordinates.innerHTML = 'XYZ: 0 / 0 / 0'
  fps.innerHTML = '0 fps'

  Helpers.applyStyle(wrapper, classes.wrapper)
  Helpers.applyStyle(leftPanel, classes.leftPanel)
  Helpers.applyStyle(rightPanel, classes.rightPanel)
  Helpers.applyStyle(title, classes.title)
  Helpers.applyStyle(coordinates, classes.coords)
  Helpers.applyStyle(fps, classes.fps)

  leftPanel.appendChild(title)
  leftPanel.appendChild(coordinates)
  leftPanel.appendChild(fps)

  wrapper.appendChild(leftPanel)
  wrapper.appendChild(rightPanel)

  if (display) Helpers.applyStyle(wrapper, { display: 'block' })

  this.getGui = () => wrapper

  this.getDOM_FPS = () => fps
  this.getDOM_coordinates = () => coordinates
  this.getDOM_title = () => title
  this.getDOM_wrapper = () => wrapper

  this.setDisplay = bool => (display = bool)
  this.getDisplay = () => display

  this.getMaxFPS = () => maxFPS
  this.setMaxFPS = f => (maxFPS = f)

  this.getMinFPS = () => minFPS
  this.setMinFPS = f => (minFPS = f)

  container.appendChild(wrapper)
  this.player.controls.setDebugControl(this)
}

Debug.prototype.calcFPS = (function() {
  let lastLoop = new Date().getMilliseconds()
  let count = 1
  let fps = 0

  return function() {
    const currentLoop = new Date().getMilliseconds()
    if (lastLoop > currentLoop) {
      fps = count
      count = 1
    } else {
      count += 1
    }
    lastLoop = currentLoop
    return fps
  }
})()

Debug.prototype.update = function() {
  const newFPS = this.calcFPS()
  const playerPos = this.player.getCoordinates()

  if (!this.getMaxFPS() || this.getMaxFPS() < newFPS) this.setMaxFPS(newFPS)
  if (!this.getMinFPS() || this.getMinFPS() > newFPS) this.setMinFPS(newFPS)

  // prettier-ignore
  this.getDOM_coordinates().innerHTML = `XYZ: ${Helpers.round(playerPos.x, 2)} /
                                ${Helpers.round(playerPos.y, 2)} /
                                ${Helpers.round(playerPos.z, 2)}`

  this.getDOM_FPS().innerHTML = `${newFPS} fps [${this.getMinFPS() || 0} - ${this.getMaxFPS() ||
    0}]`
}

Debug.prototype.toggle = function() {
  const display = this.getDisplay()
  const wrapper = this.getDOM_wrapper()

  if (display) {
    this.setDisplay(false)
    wrapper.style.display = 'none'
  } else {
    this.setDisplay(true)
    wrapper.style.display = 'block'
  }
}

export default Debug
