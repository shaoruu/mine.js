'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _deflate = require('./deflate');

Object.defineProperty(exports, 'deflate', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_deflate).default;
  }
});

var _inflate = require('./inflate');

Object.defineProperty(exports, 'inflate', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_inflate).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=index.js.map