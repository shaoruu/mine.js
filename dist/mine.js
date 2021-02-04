'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function () {
  __assign =
    Object.assign ||
    function __assign(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
      return t;
    };
  return __assign.apply(this, arguments);
};

var defaults = {
  debug: false,
  silent: false,
  playerHeight: 1.8,
  playerWidth: 0.6,
  playerStart: [0, 10, 0],
  playerAutoStep: false,
  tickRate: 33,
  blockTestDistance: 10,
  stickyPointerLock: true,
  dragCameraOutsidePointerLock: true,
  skipDefaultHighlighting: false,
  originRebaseDistance: 25,
};
var Engine = /** @class */ (function () {
  function Engine(opts) {
    this.paused = false;
    this.worldOriginOffset = [0, 0, 0];
    this.positionInCurrentTick = 0;
    this.worldName = 'default';
    this.version = require('../package.json').version;
    opts = __assign(__assign({}, defaults), { opts: opts });
    this.tickRate = opts.tickRate;
    this.dragOutsideLock = opts.dragCameraOutsidePointerLock;
    if (!opts.silent) {
      var debugStr = opts.debug ? ' (debug)' : '';
      console.log('minejs-engine v' + this.version + debugStr);
    }
    // world origin offset, used throughout engine for origin rebasing
    this.originRebaseDistance = opts.originRebaseDistance;
  }
  return Engine;
})();

exports.Engine = Engine;
