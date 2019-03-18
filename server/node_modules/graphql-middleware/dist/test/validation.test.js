"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var ava_1 = require("ava");
var graphql_tools_1 = require("graphql-tools");
var validation_1 = require("../validation");
ava_1.default('Middleware Error - Unknown type found in Middleware.', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var typeDefs, resolvers, schema, middlewareWithUndefinedType, res;
    return __generator(this, function (_a) {
        typeDefs = "\n    type Query {\n      pass: String!\n    }\n  ";
        resolvers = {
            Query: {
                pass: function () { return 'pass'; },
            },
        };
        schema = graphql_tools_1.makeExecutableSchema({ resolvers: resolvers, typeDefs: typeDefs });
        middlewareWithUndefinedType = {
            Test: function () { return ({}); },
        };
        res = t.throws(function () {
            validation_1.validateMiddleware(schema, middlewareWithUndefinedType);
        });
        t.deepEqual(res, new validation_1.MiddlewareError("Type Test exists in middleware but is missing in Schema."));
        return [2 /*return*/];
    });
}); });
ava_1.default('Middleware Error - Unknown field found in middleware.', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var typeDefs, resolvers, schema, middlewareWithUndefinedField, res;
    return __generator(this, function (_a) {
        typeDefs = "\n    type Query {\n      pass: String!\n    }\n  ";
        resolvers = {
            Query: {
                pass: function () { return 'pass'; },
            },
        };
        schema = graphql_tools_1.makeExecutableSchema({ resolvers: resolvers, typeDefs: typeDefs });
        middlewareWithUndefinedField = {
            Query: {
                test: function () { return ({}); },
            },
        };
        res = t.throws(function () {
            validation_1.validateMiddleware(schema, middlewareWithUndefinedField);
        });
        t.deepEqual(res, new validation_1.MiddlewareError("Field Query.test exists in middleware but is missing in Schema."));
        return [2 /*return*/];
    });
}); });
ava_1.default('Middleware Error - Middleware leafs are not functions.', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var typeDefs, resolvers, schema, middlewareWithObjectField, res;
    return __generator(this, function (_a) {
        typeDefs = "\n    type Query {\n      test: String!\n    }\n  ";
        resolvers = {
            Query: {
                test: function () { return 'pass'; },
            },
        };
        schema = graphql_tools_1.makeExecutableSchema({ resolvers: resolvers, typeDefs: typeDefs });
        middlewareWithObjectField = {
            Query: {
                test: false,
            },
        };
        res = t.throws(function () {
            validation_1.validateMiddleware(schema, middlewareWithObjectField);
        });
        t.deepEqual(res, new validation_1.MiddlewareError("Expected Query.test to be a function but found boolean"));
        return [2 /*return*/];
    });
}); });
//# sourceMappingURL=validation.test.js.map