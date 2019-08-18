/* -------------------------------------------------------------------------- */
/*               PORTED FROM: https://github.com/shama/voxel-sky               */
/* -------------------------------------------------------------------------- */
import Config from '../../../../config/config'

import sun from './sun'
import moon from './moon'
import stars from './stars'

import * as THREE from 'three'
import ticModule from 'tic'
import util from 'util'
import EventEmitter from 'events'

const tic = ticModule()

const SIZE = Config.chunk.size
const DIMENSION = Config.block.dimension
const MAX_SUN_INTENSITY = Config.lights.sunlight.maxIntensity
const MIN_SUN_INTENSITY = Config.lights.sunlight.minIntensity

function Sky(scene, world, opts) {
  this.time = opts.time || 0
  this.speed = opts.speed || 0.05
  this.color = opts.color || new THREE.Color(0, 0, 0)
  this.prevTime = performance.now()

  this.getWorld = () => world
  this.getWorldSize = () =>
    (world.data.user.settings.renderDistance - 1) * SIZE * DIMENSION * 2
  this.getScene = () => scene
}

util.inherits(Sky, EventEmitter)

Sky.prototype.createCanvas = function() {
  const canvas = document.createElement('canvas')
  canvas.height = 512
  canvas.width = 512
  // const context = canvas.getContext('2d')

  const material = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    map: new THREE.Texture(canvas),
    transparent: true,
    fog: false
  })
  material.magFilter = THREE.NearestFilter
  material.minFilter = THREE.LinearMipMapLinearFilter
  material.wrapS = THREE.RepeatWrapping
  material.wrapT = THREE.RepeatWrapping
  material.map.needsUpdate = true
  material.polygonOffset = true
  material.polygonOffsetFactor = -0.5

  return material
}

Sky.prototype.createBox = function() {
  const sceneRef = this.getScene()

  const mat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    fog: false
  })
  this.outer = new THREE.Mesh(
    new THREE.BoxBufferGeometry(
      this.getWorldSize(),
      this.getWorldSize(),
      this.getWorldSize()
    ),
    mat
  )
  sceneRef.add(this.outer)
  this.outer.name = 'outer-sky'

  mat.polygonOffset = true
  mat.polygonOffsetFactor = -0.5
  this.outer.renderOrder = 1

  const materials = []
  for (let i = 0; i < 6; i++) materials.push(this.createCanvas())
  this.inner = new THREE.Mesh(
    new THREE.BoxBufferGeometry(
      this.getWorldSize() - 10,
      this.getWorldSize() - 10,
      this.getWorldSize() - 10
    ),
    materials
  )
  sceneRef.add(this.inner)
  this.inner.renderOrder = 1
  this.inner.name = 'inner-sky'
}

Sky.prototype.createLights = function() {
  this.sunlight = new THREE.AmbientLight(0xffffff, 0.5)
  this.sunlight.visible = true
  this.getScene().add(this.sunlight)
}

Sky.prototype.init = function() {
  // add a sun on the bottom
  this.paint('bottom', this.sun)
  // add some stars
  this.paint(['top', 'left', 'right', 'front', 'back'], this.stars, 500)
  // add full moon to the top
  this.paint('top', this.moon, 0)
  // no sunlight at startup
  this.sunlight.intensity = 0
}

Sky.prototype.tick = function(dt, fastForward = false) {
  if (!dt) {
    const now = performance.now()
    dt = now - this.prevTime
    this.prevTime = now
  }

  const worldRef = this.getWorld()
  const playerRef = worldRef.player

  tic.tick(dt)
  this.fn.call(this, this.time, fastForward)
  if (playerRef) {
    const pos = playerRef.getObject().position

    this.outer.position.copy(pos)
    this.inner.position.copy(pos)
  }
  this.time += this.speed

  if (this.time > 2400) this.time = 0

  if (dt >= 160) {
    const iterations = dt / 16
    const ffTime = iterations * this.speed
    this.setTime(this.time + ffTime)
  }
  return this
}

Sky.prototype.colorFunc = function(end, time) {
  if (this.colorInterval) this.colorInterval()

  let i = 0
  const start = {}
  this.color.clone().getHSL(start)
  const color = {}
  this.color.clone().getHSL(color)

  this.colorInterval = tic.interval(() => {
    const dt = i / time
    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const p in color) color[p] = start[p] + (end[p] - start[p]) * dt
    this.color.setHSL(color.h, color.s, color.l)
    this.outer.material.color.setHSL(color.h, color.s, color.l)
    this.getScene().background.setHSL(color.h, color.s, color.l)
    // this.sunlight.color.setHSL(color.h, color.s, color.l)
    if (this.getScene().fog)
      this.getScene().fog.color.setHSL(color.h, color.s, color.l)
    if (dt >= 1) this.colorInterval()
    i += this.speed
  }, this.speed)
}

Sky.prototype.speed = function(speed) {
  if (typeof speed === 'number') this.speed = speed
  return this.speed
}

Sky.prototype.paint = function(faces, fn) {
  // eslint-disable-next-line prefer-rest-params
  const args = Array.prototype.slice.call(arguments, 2)
  const index = ['back', 'front', 'top', 'bottom', 'left', 'right']
  if (faces === 'all') faces = index
  else if (faces === 'sides') faces = ['back', 'front', 'left', 'right']
  if (!Array.isArray(faces)) faces = [faces]
  faces.forEach(face => {
    if (typeof face === 'string') {
      face = index.indexOf(String(face).toLowerCase())
      if (face === -1) return
    }
    this.material = this.inner.material[face]
    this.canvas = this.material.map.image
    this.context = this.canvas.getContext('2d')
    fn.apply(this, args)
    this.inner.material[face].map.needsUpdate = true
  })
  this.material = false
  this.canvas = false
  this.context = false
}

Sky.prototype.spin = function(r, axis) {
  axis = axis || 'x'
  this.inner.rotation[axis] = r
  this.outer.rotation[axis] = r
}

Sky.prototype.clear = function() {
  if (!this.canvas) return false
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
}

Sky.prototype.sun = sun
Sky.prototype.moon = moon
Sky.prototype.stars = stars

// default sky
Sky.prototype.default = {
  hours: {
    0: { color: { h: 230 / 360, s: 0.3, l: 0 } },
    400: { color: { h: 26 / 360, s: 0.3, l: 0.5 } },
    600: { color: { h: 214 / 360, s: 0.98, l: 0.83 } },
    1600: { color: { h: 26 / 360, s: 0.3, l: 0.5 } },
    1800: { color: { h: 230 / 360, s: 0.3, l: 0 } }
  },
  day: 0,
  moonCycle: 29.5305882,
  until: false,
  last: 0
}

Sky.prototype.fn = function(time, fastForward) {
  time = parseFloat(time.toFixed(1))

  const my = this.default
  const hour = Math.round(time / 100) * 100
  const speed = Math.abs(my.last - time)
  my.last = time

  // run initialization once
  if (my.init) {
    my.init.call(this)
    my.init = undefined
  }

  // switch color based on time of day
  // maybe make this next part into a helper function
  if (my.hours[hour]) {
    if (!my.until) {
      this.colorFunc(my.hours[hour].color, speed > 9 ? 100 : 60)
      my.until = hour + 100
    }
  }
  if (my.until === hour) my.until = false

  // change moon phase
  if (time === 1200) {
    this.paint('top', this.clear)
    this.paint(
      'top',
      this.moon,
      Math.floor(my.day % my.moonCycle) / my.moonCycle
    )
    this.paint('top', this.stars, 500)
  }

  // fade stars in and out
  if (time === 500) {
    this.paint(['top', 'left', 'right', 'front', 'back'], function() {
      this.material.transparent = true
      let i
      if (fastForward) this.material.opacity = 0
      else {
        i = tic.interval(
          function(mat) {
            mat.opacity -= 0.1
            if (mat.opacity <= 0) i()
          },
          100,
          this.material
        )
      }
    })
  }
  if (time === 1800) {
    this.paint(['top', 'left', 'right', 'front', 'back'], function() {
      this.material.transparent = true
      let i
      if (fastForward) this.material.opacity = 1
      else {
        i = tic.interval(
          function(mat) {
            mat.opacity += 0.1
            if (mat.opacity >= 1) i()
          },
          100,
          this.material
        )
      }
    })
  }

  // turn on sunlight
  if (time === 500) {
    let i
    if (fastForward) this.sunlight.intensity = MAX_SUN_INTENSITY
    else {
      i = tic.interval(() => {
        this.sunlight.intensity += 0.005
        if (this.sunlight.intensity >= MAX_SUN_INTENSITY) i()
      }, 100)
    }
  }

  // turn off sunlight
  if (time === 1600) {
    let i
    if (fastForward) this.sunlight.intensity = MIN_SUN_INTENSITY
    else {
      i = tic.interval(() => {
        this.sunlight.intensity -= 0.01
        if (this.sunlight.intensity <= MIN_SUN_INTENSITY) i()
      }, 100)
    }
  }

  // spin the sky 1 revolution per day
  this.spin(Math.PI * 2 * (time / 2400))

  // keep track of days
  if (time === 2400) {
    my.day++
    this.emit('new-day')
  }
}

Sky.prototype.rgba = function(c, o) {
  if (arguments.length === 4) {
    // eslint-disable-next-line prefer-rest-params
    c = { r: arguments[0], g: arguments[1], b: arguments[2] }
    // eslint-disable-next-line prefer-destructuring, prefer-rest-params
    o = arguments[3]
  }
  return `rgba(${c.r * 255}, ${c.g * 255}, ${c.b * 255}, ${o})`
}

Sky.prototype.getTime = function(dec = 1) {
  const t = parseFloat(this.time.toFixed(dec))
  return t
}

Sky.prototype.getDays = function() {
  return this.default.day
}

Sky.prototype.setTime = function(time) {
  this.time = time
  for (let i = 0; i <= 2400; i += this.speed) this.tick(16, true)
}

Sky.prototype.setDays = function(days) {
  this.default.day = days
}

export default function(world, scene, opts) {
  const sky = new Sky(world, scene, opts || {})
  sky.createBox()
  sky.createLights()
  sky.init()
  return function(time, days) {
    // move to the specific time of the day
    sky.setTime(time)
    sky.setDays(days)

    return sky
  }
}
