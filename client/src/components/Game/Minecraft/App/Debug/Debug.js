import Helpers from '../../Utils/Helpers'
import classes from './Debug.module.css'

function Debug(player, world) {
  let display = false

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

  const calcFPS = (function() {
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

  this.getGui = () => wrapper

  this.update = () => {
    const newFPS = calcFPS()
    const playerPos = player.getCoordinates()

    // prettier-ignore
    coordinates.innerHTML = `XYZ: ${Helpers.round(playerPos.x, 2)} / 
                                  ${Helpers.round(playerPos.y, 2)} /
                                  ${Helpers.round(playerPos.z, 2)}`
    fps.innerHTML = `${newFPS} fps`
  }

  this.toggle = () => {
    if (display) {
      display = false
      wrapper.style.display = 'none'
    } else {
      display = true
      wrapper.style.display = 'block'
    }
  }
}

export default Debug
