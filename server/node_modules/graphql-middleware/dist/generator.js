"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MiddlewareGenerator = /** @class */ (function () {
    function MiddlewareGenerator(generator) {
        this.generator = generator;
    }
    MiddlewareGenerator.prototype.generate = function (schema) {
        return this.generator(schema);
    };
    return MiddlewareGenerator;
}());
exports.MiddlewareGenerator = MiddlewareGenerator;
//# sourceMappingURL=generator.js.map