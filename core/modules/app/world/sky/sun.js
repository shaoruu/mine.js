import * as THREE from 'three'

export default function(r, color) {
  let x
  let y

  if (!this.canvas) return false
  r = r || 50
  color = color || new THREE.Color(0xf8ffb5)

  this.context.save()

  // bg glow
  this.context.beginPath()
  x = this.canvas.width / 2
  y = this.canvas.height / 2
  const grd = this.context.createRadialGradient(x, y, 1, x, y, r * 2)
  grd.addColorStop(0, this.rgba(1, 1, 1, 0.3))
  grd.addColorStop(1, this.rgba(1, 1, 1, 0))
  this.context.arc(x, y, r * 2, 0, 2 * Math.PI, false)
  this.context.fillStyle = grd
  this.context.fill()
  this.context.closePath()

  // outer sun
  this.context.beginPath()
  x = this.canvas.width / 2 - r / 2
  y = this.canvas.height / 2 - r / 2
  this.context.rect(x, y, r, r)
  this.context.fillStyle = this.rgba(color, 1)
  this.context.fill()
  this.context.closePath()

  // inner sun
  this.context.beginPath()
  r /= 1.6
  x = this.canvas.width / 2 - r / 2
  y = this.canvas.height / 2 - r / 2
  this.context.rect(x, y, r, r)
  this.context.fillStyle = this.rgba(1, 1, 1, 0.5)
  this.context.fill()
  this.context.closePath()

  this.context.restore()
}
