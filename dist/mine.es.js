import { EventEmitter } from 'events';

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
/* global Reflect, Promise */

var extendStatics = function (d, b) {
  extendStatics =
    Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array &&
      function (d, b) {
        d.__proto__ = b;
      }) ||
    function (d, b) {
      for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
    };
  return extendStatics(d, b);
};

function __extends(d, b) {
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
}

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
var Engine = /** @class */ (function (_super) {
  __extends(Engine, _super);
  function Engine(opts) {
    var _this = _super.call(this) || this;
    _this.paused = false;
    _this.worldOriginOffset = [0, 0, 0];
    _this.positionInCurrentTick = 0;
    _this.worldName = 'default';
    _this.version = require('../package.json').version;
    opts = __assign(__assign({}, defaults), { opts: opts });
    _this.tickRate = opts.tickRate;
    _this.dragOutsideLock = opts.dragCameraOutsidePointerLock;
    if (!opts.silent) {
      var debugStr = opts.debug ? ' (debug)' : '';
      console.log('minejs-engine v' + _this.version + debugStr);
    }
    // world origin offset, used throughout engine for origin rebasing
    _this.originRebaseDistance = opts.originRebaseDistance;
    return _this;
  }
  return Engine;
})(EventEmitter);

export { Engine };
