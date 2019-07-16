/* eslint-disable */

// Prerequisites
window.requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  (f => {
    return setTimeout(f, 1000 / 60)
  }) // simulate calling code 60

window.cancelAnimationFrame =
  window.cancelAnimationFrame ||
  window.mozCancelAnimationFrame ||
  (requestID => {
    clearTimeout(requestID)
  }) // fall back

/**
 * Behaves the same as setInterval except uses requestAnimationFrame() where possible for better performance
 * @param {function} fn The callback function
 * @param {int} delay The delay in milliseconds
 */
window.requestInterval = function(fn, delay) {
  let start = performance.now()
  var handle = {}
  function loop() {
    handle.value = window.requestAnimationFrame(loop)
    let current = performance.now()
    var delta = current - start
    if (delta >= delay) {
      fn.call()
      start = performance.now()
    }
  }
  handle.value = window.requestAnimationFrame(loop)
  return handle
}

/**
 * Behaves the same as clearInterval except uses cancelRequestAnimationFrame() where possible for better performance
 * @param {int|object} fn The callback function
 */
window.clearRequestInterval = function(handle) {
  window.cancelAnimationFrame
    ? window.cancelAnimationFrame(handle.value)
    : window.webkitCancelAnimationFrame
    ? window.webkitCancelAnimationFrame(handle.value)
    : window.webkitCancelRequestAnimationFrame
    ? window.webkitCancelRequestAnimationFrame(handle.value) /* Support for legacy API */
    : window.mozCancelRequestAnimationFrame
    ? window.mozCancelRequestAnimationFrame(handle.value)
    : window.oCancelRequestAnimationFrame
    ? window.oCancelRequestAnimationFrame(handle.value)
    : window.msCancelRequestAnimationFrame
    ? window.msCancelRequestAnimationFrame(handle.value)
    : clearInterval(handle)
}

/**
 * Behaves the same as setTimeout except uses requestAnimationFrame() where possible for better performance
 * @param {function} fn The callback function
 * @param {int} delay The delay in milliseconds
 */
window.requestTimeout = function(fn, delay) {
  if (
    !window.requestAnimationFrame &&
    !window.webkitRequestAnimationFrame &&
    !(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) && // Firefox 5 ships without cancel support
    !window.oRequestAnimationFrame &&
    !window.msRequestAnimationFrame
  )
    return window.setTimeout(fn, delay)

  let start = performance.now()
  var handle = {}

  function loop() {
    let current = performance.now()
    var delta = current - start

    delta >= delay ? fn.call() : (handle.value = window.requestAnimationFrame(loop))
  }

  handle.value = window.requestAnimationFrame(loop)
  return handle
}

/**
 * Behaves the same as clearTimeout except uses cancelRequestAnimationFrame() where possible for better performance
 * @param {int|object} fn The callback function
 */
window.clearRequestTimeout = function(handle) {
  window.cancelAnimationFrame
    ? window.cancelAnimationFrame(handle.value)
    : window.webkitCancelAnimationFrame
    ? window.webkitCancelAnimationFrame(handle.value)
    : window.webkitCancelRequestAnimationFrame
    ? window.webkitCancelRequestAnimationFrame(handle.value) /* Support for legacy API */
    : window.mozCancelRequestAnimationFrame
    ? window.mozCancelRequestAnimationFrame(handle.value)
    : window.oCancelRequestAnimationFrame
    ? window.oCancelRequestAnimationFrame(handle.value)
    : window.msCancelRequestAnimationFrame
    ? window.msCancelRequestAnimationFrame(handle.value)
    : clearTimeout(handle)
}
