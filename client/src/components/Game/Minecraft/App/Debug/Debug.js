import Helpers from '../../Utils/Helpers'
import classes from './Debug.module.css'

function Debug(player, world) {
  this.player = player
  this.world = world

  let display = process.env.NODE_ENV === 'development'

  const wrapper = document.createElement('div'),
    leftPanel = document.createElement('div'),
    rightPanel = document.createElement('div'),
    title = document.createElement('p'),
    coordinates = document.createElement('p'),
    fps = document.createElement('p')

  // DEFAULTS
  title.innerHTML = 'MinecraftJS (dev/beta/vanilla)'
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
}

Debug.prototype.calcFPS = (function() {
  let lastLoop = new Date().getMilliseconds(),
    count = 1,
    fps = 0

  return function() {
    let currentLoop = new Date().getMilliseconds()
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

  // prettier-ignore
  this.getDOM_coordinates().innerHTML = `XYZ: ${Helpers.round(playerPos.x, 2)} / 
                                ${Helpers.round(playerPos.y, 2)} /
                                ${Helpers.round(playerPos.z, 2)}`

  this.getDOM_FPS().innerHTML = `${newFPS} fps`
}

Debug.prototype.toggle = function() {
  const display = this.getDisplay(),
    wrapper = this.getDOM_wrapper()

  if (display) {
    this.setDisplay(false)
    wrapper.style.display = 'none'
  } else {
    this.setDisplay(true)
    wrapper.style.display = 'block'
  }
}

export default Debug
