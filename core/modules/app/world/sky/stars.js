module.exports = function(amt) {
  if (!this.canvas) return false
  const colors = [
    '#FFFFFF',
    '#FFFFFF',
    '#FFFFFF',
    '#FFFFFF',
    '#FFFFFF',
    '#FFFFFF',
    '#FFFFFF',
    '#FFFFFF',
    '#FFFFFF',
    '#FFFFFF',
    '#8589FF',
    '#FF8585'
  ]
  const alpha = this.context.globalAlpha
  for (let i = 0; i < amt; i++) {
    this.context.globalAlpha = Math.random() * 1 + 0.5
    this.context.beginPath()
    this.context.arc(
      Math.random() * this.canvas.width,
      Math.random() * this.canvas.height,
      Math.random() * 0.5,
      0,
      2 * Math.PI,
      false
    )
    this.context.fillStyle = colors[Math.floor(Math.random() * colors.length)]
    this.context.fill()
  }
  this.context.globalAlpha = alpha
}
