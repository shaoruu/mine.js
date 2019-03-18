"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var generator_1 = require("./generator");
function middleware(generator) {
    return new generator_1.MiddlewareGenerator(generator);
}
exports.middleware = middleware;
//# sourceMappingURL=constructors.js.map