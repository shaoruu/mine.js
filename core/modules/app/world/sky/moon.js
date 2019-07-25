import * as THREE from 'three'

export default function(phase, r, color) {
  if (!this.canvas) return false
  r = r || 20
  color = color || new THREE.Color(0xe6e2d1)
  const x = this.canvas.width / 2
  const y = this.canvas.height / 2

  // bg glow
  this.context.beginPath()
  const grd = this.context.createRadialGradient(
    x + r / 2,
    y + r / 2,
    1,
    x + r / 2,
    y + r / 2,
    r * 2
  )
  grd.addColorStop(0, this.rgba(1, 1, 1, 0.3))
  grd.addColorStop(1, this.rgba(1, 1, 1, 0))
  this.context.arc(x + r / 2, y + r / 2, r * 2, 0, 2 * Math.PI, false)
  this.context.fillStyle = grd
  this.context.fill()
  this.context.closePath()

  // clipping region
  this.context.save()
  this.context.beginPath()
  this.context.rect(x, y, r, r)
  this.context.clip()

  // moon bg
  this.context.beginPath()
  this.context.rect(x, y, r, r)
  this.context.fillStyle = this.rgba(color, 1)
  this.context.fill()

  this.context.translate(x, y)

  // lighter inside
  this.context.beginPath()
  this.context.rect(4, 4, r - 8, r - 8)
  this.context.fillStyle = this.rgba(1, 1, 1, 0.8)
  this.context.fill()

  // moon phase
  const px = phase * r * 2 - r
  this.context.beginPath()
  this.context.rect(px, 0, r, r)
  this.context.fillStyle = this.rgba(0, 0, 0, 0.8)
  this.context.fill()
  this.context.beginPath()
  this.context.rect(2 + px, 2, r - 4, r - 4)
  this.context.fillStyle = this.rgba(0, 0, 0, 0.9)
  this.context.fill()

  this.context.restore()
}
