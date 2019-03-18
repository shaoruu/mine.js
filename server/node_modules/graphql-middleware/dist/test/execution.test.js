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
var graphql_1 = require("graphql");
var __1 = require("../");
ava_1.default('Middleware execution order', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var typeDefs, resolvers, schema, firstMiddleware, secondMiddleware, schemaWithMiddleware, query;
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                t.plan(2);
                typeDefs = "\n    type Query {\n      test: String!\n    }\n  ";
                resolvers = {
                    Query: {
                        test: function () { return 'pass'; },
                    },
                };
                schema = graphql_tools_1.makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers });
                firstMiddleware = function (t) { return function (resolve, parent, args, ctx, info) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        t.pass();
                        if (!ctx._execution) {
                            ctx._execution = true;
                        }
                        return [2 /*return*/, resolve()];
                    });
                }); }; };
                secondMiddleware = function (t) { return function (resolve, parent, args, ctx, info) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        if (ctx._execution) {
                            t.pass();
                        }
                        return [2 /*return*/, resolve()];
                    });
                }); }; };
                schemaWithMiddleware = __1.applyMiddleware(schema, firstMiddleware(t), secondMiddleware(t));
                query = "\n    query {\n      test\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query, null, {})];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Argumnets forwarded correctly', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var typeDefs, resolvers, middleware, schema, schemaWithMiddleware, query, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                t.plan(3);
                typeDefs = "\n    type Query {\n      test(arg: String!): Test!\n    }\n    \n    type Test {\n      parent: String!\n    }\n  ";
                resolvers = {
                    Query: {
                        test: function (parent, _a, ctx, info) {
                            var arg = _a.arg;
                            t.is(arg, 'pass');
                            return 'fail';
                        },
                    },
                    Test: {
                        parent: function (parent, arg, ctx, info) {
                            t.is(parent, 'pass');
                            return 'pass';
                        },
                    },
                };
                middleware = function (resolve, parent, args, ctx, info) {
                    return resolve('pass', { arg: 'pass' }, ctx, info);
                };
                schema = graphql_tools_1.makeExecutableSchema({ resolvers: resolvers, typeDefs: typeDefs });
                schemaWithMiddleware = __1.applyMiddleware(schema, middleware);
                query = "\n    query {\n      test(arg: \"fail\") {\n        parent\n      }\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query)];
            case 1:
                res = _a.sent();
                t.deepEqual(res, {
                    data: {
                        test: {
                            parent: 'pass',
                        },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Schema, Type, Field - Overlapping', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var typeDefs, resolvers, addOne, schemaMiddleware, typeMiddleware, fieldMiddleware, query, schemaWithMiddleware1, schemaWithMiddleware2, schemaWithMiddleware3, schemaWithMiddleware4, schemaWithMiddleware5, schemaWithMiddleware6, res1, res2, res3, res4, res5, res6, res;
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                typeDefs = "\n  type Query {\n    # Field scoped\n    fieldTest: Int!\n    fieldTestNothing: Int!\n    # Type scoped\n    forward: Type!\n    typeTestNothing: Int!\n  }\n\n  type Type {\n    typeTest: Int!\n    fieldTest: Int!\n  }\n";
                resolvers = {
                    Query: {
                        fieldTest: function () { return 0; },
                        fieldTestNothing: function () { return 0; },
                        forward: function () { return ({}); },
                        typeTestNothing: function () { return 0; },
                    },
                    Type: {
                        typeTest: function () { return 0; },
                        fieldTest: function () { return 0; },
                    },
                };
                addOne = function (resolve, parent, args, ctx, info) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, resolve()];
                            case 1: return [2 /*return*/, (_a.sent()) + 1];
                        }
                    });
                }); };
                schemaMiddleware = function (resolve, parent, args, ctx, info) { return __awaiter(_this, void 0, void 0, function () {
                    var res;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, resolve()];
                            case 1:
                                res = _a.sent();
                                if (typeof res === 'number') {
                                    return [2 /*return*/, res + 1];
                                }
                                else {
                                    return [2 /*return*/, res];
                                }
                                return [2 /*return*/];
                        }
                    });
                }); };
                typeMiddleware = {
                    Type: addOne,
                };
                fieldMiddleware = {
                    Query: {
                        fieldTest: addOne,
                    },
                    Type: {
                        fieldTest: addOne,
                    },
                };
                query = "\n    query {\n      fieldTest # 2 (schema, field)\n      fieldTestNothing # 1 (schema)\n      forward {\n        typeTest # 2 (schema, type)\n        fieldTest # 3 (schema, type, field)\n      }\n      typeTestNothing # 1 (schema)\n    }\n  ";
                schemaWithMiddleware1 = __1.applyMiddleware(graphql_tools_1.makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers }), schemaMiddleware, fieldMiddleware, typeMiddleware);
                schemaWithMiddleware2 = __1.applyMiddleware(graphql_tools_1.makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers }), schemaMiddleware, typeMiddleware, fieldMiddleware);
                schemaWithMiddleware3 = __1.applyMiddleware(graphql_tools_1.makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers }), typeMiddleware, schemaMiddleware, fieldMiddleware);
                schemaWithMiddleware4 = __1.applyMiddleware(graphql_tools_1.makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers }), typeMiddleware, fieldMiddleware, schemaMiddleware);
                schemaWithMiddleware5 = __1.applyMiddleware(graphql_tools_1.makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers }), fieldMiddleware, schemaMiddleware, typeMiddleware);
                schemaWithMiddleware6 = __1.applyMiddleware(graphql_tools_1.makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers }), fieldMiddleware, typeMiddleware, schemaMiddleware);
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware1, query)];
            case 1:
                res1 = _a.sent();
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware2, query)];
            case 2:
                res2 = _a.sent();
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware3, query)];
            case 3:
                res3 = _a.sent();
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware4, query)];
            case 4:
                res4 = _a.sent();
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware5, query)];
            case 5:
                res5 = _a.sent();
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware6, query)];
            case 6:
                res6 = _a.sent();
                res = [res1, res2, res3, res4, res5, res6].map(function (obj) {
                    return JSON.stringify(obj);
                });
                t.true(res.every(function (r) { return r === res[0]; }));
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=execution.test.js.map