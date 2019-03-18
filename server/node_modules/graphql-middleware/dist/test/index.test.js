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
var iterall_1 = require("iterall");
var __1 = require("../");
// Setup ---------------------------------------------------------------------
var typeDefs = "\n  type Query {\n    before(arg: String!): String!\n    beforeNothing(arg: String!): String!\n    after: String!\n    afterNothing: String!\n    null: String\n    nested: Nothing!\n    resolverless: Resolverless!\n  }\n\n  type Mutation {\n    before(arg: String!): String!\n    beforeNothing(arg: String!): String!\n    after: String!\n    afterNothing: String!\n    null: String\n    nested: Nothing!\n  }\n  \n  type Subscription {\n    sub: String\n  }\n\n  type Nothing {\n    nothing: String!\n  }\n\n  type Resolverless {\n    someData: String!\n  }\n\n  schema {\n    query: Query,\n    mutation: Mutation,\n    subscription: Subscription\n  }\n";
var resolvers = {
    Query: {
        before: function (parent, _a, ctx, info) {
            var arg = _a.arg;
            return arg;
        },
        beforeNothing: function (parent, _a, ctx, info) {
            var arg = _a.arg;
            return arg;
        },
        after: function () { return 'after'; },
        afterNothing: function () { return 'after'; },
        null: function () { return null; },
        nested: function () { return ({}); },
        resolverless: function () { return ({ someData: 'data' }); },
    },
    Mutation: {
        before: function (parent, _a, ctx, info) {
            var arg = _a.arg;
            return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_b) {
                return [2 /*return*/, arg];
            }); });
        },
        beforeNothing: function (parent, _a, ctx, info) {
            var arg = _a.arg;
            return arg;
        },
        after: function () { return 'after'; },
        afterNothing: function () { return 'after'; },
        null: function () { return null; },
        nested: function () { return ({}); },
    },
    Subscription: {
        sub: {
            subscribe: function (parent, _a, ctx, info) {
                var arg = _a.arg;
                return __awaiter(_this, void 0, void 0, function () {
                    var _b, iterator;
                    return __generator(this, function (_c) {
                        iterator = (_b = {
                                next: function () { return Promise.resolve({ done: false, value: { sub: arg } }); },
                                return: function () {
                                    return;
                                },
                                throw: function () {
                                    return;
                                }
                            },
                            _b[iterall_1.$$asyncIterator] = function () { return iterator; },
                            _b);
                        return [2 /*return*/, iterator];
                    });
                });
            },
        },
    },
    Nothing: {
        nothing: function () { return 'nothing'; },
    },
};
var getSchema = function () { return graphql_tools_1.makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers }); };
// Middleware ----------------------------------------------------------------
// Field Middleware
var fieldMiddleware = {
    Query: {
        before: function (resolve, parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
            var _args;
            return __generator(this, function (_a) {
                _args = { arg: 'changed' };
                return [2 /*return*/, resolve(parent, _args)];
            });
        }); },
        after: function (resolve, parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                res = resolve();
                return [2 /*return*/, 'changed'];
            });
        }); },
    },
    Mutation: {
        before: function (resolve, parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
            var _args;
            return __generator(this, function (_a) {
                _args = { arg: 'changed' };
                return [2 /*return*/, resolve(parent, _args)];
            });
        }); },
        after: function (resolve, parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                res = resolve();
                return [2 /*return*/, 'changed'];
            });
        }); },
    },
    Subscription: {
        sub: function (resolve, parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
            var _args;
            return __generator(this, function (_a) {
                _args = { arg: 'changed' };
                return [2 /*return*/, resolve(parent, _args)];
            });
        }); },
    },
};
// Type Middleware
var typeMiddlewareBefore = {
    Query: function (resolve, parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
        var _args;
        return __generator(this, function (_a) {
            _args = { arg: 'changed' };
            return [2 /*return*/, resolve(parent, _args)];
        });
    }); },
    Mutation: function (resolve, parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
        var _args;
        return __generator(this, function (_a) {
            _args = { arg: 'changed' };
            return [2 /*return*/, resolve(parent, _args)];
        });
    }); },
    Subscription: function (resolve, parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
        var _args;
        return __generator(this, function (_a) {
            _args = { arg: 'changed' };
            return [2 /*return*/, resolve(parent, _args)];
        });
    }); },
};
var typeMiddlewareAfter = {
    Query: function (resolve, parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            res = resolve();
            return [2 /*return*/, 'changed'];
        });
    }); },
    Mutation: function (resolve, parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            res = resolve();
            return [2 /*return*/, 'changed'];
        });
    }); },
};
// Schema Middleware
var schemaMiddlewareBefore = function (resolve, parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
    var _args;
    return __generator(this, function (_a) {
        _args = { arg: 'changed' };
        return [2 /*return*/, resolve(parent, _args, context, info)];
    });
}); };
var schemaMiddlewareAfter = function (resolve, parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
    var res;
    return __generator(this, function (_a) {
        res = resolve();
        return [2 /*return*/, 'changed'];
    });
}); };
var emptyStringMiddleware = function (resolve, parent, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (/^String!?$/.test(info.returnType)) {
            return [2 /*return*/, ''];
        }
        else {
            return [2 /*return*/, resolve()];
        }
        return [2 /*return*/];
    });
}); };
// Test ----------------------------------------------------------------------
// Field
ava_1.default('Field middleware - Query', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, fieldMiddleware);
                query = "\n    query {\n      before(arg: \"before\")\n      beforeNothing(arg: \"before\")\n      after\n      afterNothing\n      null\n      nested { nothing }\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query)];
            case 1:
                res = _a.sent();
                t.deepEqual(res, {
                    data: {
                        before: 'changed',
                        beforeNothing: 'before',
                        after: 'changed',
                        afterNothing: 'after',
                        null: null,
                        nested: { nothing: 'nothing' },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Field middleware - Mutation', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, fieldMiddleware);
                query = "\n    mutation {\n      before(arg: \"before\")\n      beforeNothing(arg: \"before\")\n      after\n      afterNothing\n      null\n      nested { nothing }\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query)];
            case 1:
                res = _a.sent();
                t.deepEqual(res, {
                    data: {
                        before: 'changed',
                        beforeNothing: 'before',
                        after: 'changed',
                        afterNothing: 'after',
                        null: null,
                        nested: { nothing: 'nothing' },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Field middleware - Subscription', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, iterator, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, fieldMiddleware);
                query = "\n    subscription {\n      sub\n    }\n  ";
                return [4 /*yield*/, graphql_1.subscribe(schemaWithMiddleware, graphql_1.parse(query))];
            case 1:
                iterator = _a.sent();
                return [4 /*yield*/, iterator.next()];
            case 2:
                res = _a.sent();
                t.deepEqual(res, {
                    done: false,
                    value: {
                        data: {
                            sub: 'changed',
                        },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
// Type
ava_1.default('Type middleware - Query before', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, typeMiddlewareBefore);
                query = "\n    query {\n      before(arg: \"before\")\n      beforeNothing(arg: \"before\")\n      after\n      afterNothing\n      null\n      nested { nothing }\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query)];
            case 1:
                res = _a.sent();
                t.deepEqual(res, {
                    data: {
                        before: 'changed',
                        beforeNothing: 'changed',
                        after: 'after',
                        afterNothing: 'after',
                        null: null,
                        nested: { nothing: 'nothing' },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Type middleware - Query after', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, typeMiddlewareAfter);
                query = "\n    query {\n      before(arg: \"before\")\n      beforeNothing(arg: \"before\")\n      after\n      afterNothing\n      null\n      nested { nothing }\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query)];
            case 1:
                res = _a.sent();
                t.deepEqual(res, {
                    data: {
                        before: 'changed',
                        beforeNothing: 'changed',
                        after: 'changed',
                        afterNothing: 'changed',
                        null: 'changed',
                        nested: { nothing: 'nothing' },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Type middleware - Mutation before', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, typeMiddlewareBefore);
                query = "\n    mutation {\n      before(arg: \"before\")\n      beforeNothing(arg: \"before\")\n      after\n      afterNothing\n      null\n      nested { nothing }\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query)];
            case 1:
                res = _a.sent();
                t.deepEqual(res, {
                    data: {
                        before: 'changed',
                        beforeNothing: 'changed',
                        after: 'after',
                        afterNothing: 'after',
                        null: null,
                        nested: { nothing: 'nothing' },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Type middleware - Mutation after', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, typeMiddlewareAfter);
                query = "\n    mutation {\n      before(arg: \"before\")\n      beforeNothing(arg: \"before\")\n      after\n      afterNothing\n      null\n      nested { nothing }\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query)];
            case 1:
                res = _a.sent();
                t.deepEqual(res, {
                    data: {
                        before: 'changed',
                        beforeNothing: 'changed',
                        after: 'changed',
                        afterNothing: 'changed',
                        null: 'changed',
                        nested: { nothing: 'nothing' },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Type middleware - Subscription', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, iterator, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, typeMiddlewareBefore);
                query = "\n    subscription {\n      sub\n    }\n  ";
                return [4 /*yield*/, graphql_1.subscribe(schemaWithMiddleware, graphql_1.parse(query))];
            case 1:
                iterator = _a.sent();
                return [4 /*yield*/, iterator.next()];
            case 2:
                res = _a.sent();
                t.deepEqual(res, {
                    done: false,
                    value: {
                        data: {
                            sub: 'changed',
                        },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
// Schema
ava_1.default('Schema middleware - Query before', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, schemaMiddlewareBefore);
                query = "\n    query {\n      before(arg: \"before\")\n      beforeNothing(arg: \"before\")\n      after\n      afterNothing\n      null\n      nested { nothing }\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query)];
            case 1:
                res = _a.sent();
                t.deepEqual(res, {
                    data: {
                        before: 'changed',
                        beforeNothing: 'changed',
                        after: 'after',
                        afterNothing: 'after',
                        null: null,
                        nested: { nothing: 'nothing' },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Schema middleware - Query after', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, schemaMiddlewareAfter);
                query = "\n    query {\n      before(arg: \"before\")\n      beforeNothing(arg: \"before\")\n      after\n      afterNothing\n      null\n      nested { nothing }\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query)];
            case 1:
                res = _a.sent();
                t.deepEqual(res, {
                    data: {
                        before: 'changed',
                        beforeNothing: 'changed',
                        after: 'changed',
                        afterNothing: 'changed',
                        null: 'changed',
                        nested: { nothing: 'changed' },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Schema middleware - Mutation before', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, schemaMiddlewareBefore);
                query = "\n    mutation {\n      before(arg: \"before\")\n      beforeNothing(arg: \"before\")\n      after\n      afterNothing\n      null\n      nested { nothing }\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query)];
            case 1:
                res = _a.sent();
                t.deepEqual(res, {
                    data: {
                        before: 'changed',
                        beforeNothing: 'changed',
                        after: 'after',
                        afterNothing: 'after',
                        null: null,
                        nested: { nothing: 'nothing' },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Schema middleware - Mutation after', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, schemaMiddlewareAfter);
                query = "\n    mutation {\n      before(arg: \"before\")\n      beforeNothing(arg: \"before\")\n      after\n      afterNothing\n\n      null\n      nested { nothing }\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query)];
            case 1:
                res = _a.sent();
                t.deepEqual(res, {
                    data: {
                        before: 'changed',
                        beforeNothing: 'changed',
                        after: 'changed',
                        afterNothing: 'changed',
                        null: 'changed',
                        nested: { nothing: 'changed' },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Schema middleware - Subscription', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, iterator, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, schemaMiddlewareBefore);
                query = "\n    subscription {\n      sub\n    }\n  ";
                return [4 /*yield*/, graphql_1.subscribe(schemaWithMiddleware, graphql_1.parse(query))];
            case 1:
                iterator = _a.sent();
                return [4 /*yield*/, iterator.next()];
            case 2:
                res = _a.sent();
                t.deepEqual(res, {
                    done: false,
                    value: {
                        data: {
                            sub: 'changed',
                        },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Schema middleware - Uses default field resolver', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var schema, schemaWithMiddleware, query, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                schema = getSchema();
                schemaWithMiddleware = __1.applyMiddleware(schema, schemaMiddlewareBefore);
                query = "\n    query {\n      resolverless {\n        someData\n      }\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query)];
            case 1:
                res = _a.sent();
                t.deepEqual(res, {
                    data: {
                        resolverless: {
                            someData: 'data',
                        },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
// Combinations and overlapping
ava_1.default('Combinations - Schema, Type, Field middleware', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var typeDefs, resolvers, schema, addOne, schemaMiddleware, typeMiddleware, fieldMiddleware, schemaWithMiddleware, query, res;
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                typeDefs = "\n    type Query {\n      # Field scoped\n      fieldTest: Int!\n      fieldTestNothing: Int!\n      # Type scoped\n      forward: Type!\n      typeTestNothing: Int!\n    }\n\n    type Type {\n      typeTest: Int!\n      fieldTest: Int!\n    }\n  ";
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
                schema = graphql_tools_1.makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers });
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
                schemaWithMiddleware = __1.applyMiddleware(schema, schemaMiddleware, fieldMiddleware, typeMiddleware);
                query = "\n    query {\n      fieldTest # 2 (schema, field)\n      fieldTestNothing # 1 (schema)\n      forward {\n        typeTest # 2 (schema, type)\n        fieldTest # 3 (schema, type, field)\n      }\n      typeTestNothing # 1 (schema)\n    }\n  ";
                return [4 /*yield*/, graphql_1.graphql(schemaWithMiddleware, query)];
            case 1:
                res = _a.sent();
                t.deepEqual(res, {
                    data: {
                        fieldTest: 2,
                        fieldTestNothing: 1,
                        forward: {
                            typeTest: 2,
                            fieldTest: 3,
                        },
                        typeTestNothing: 1,
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=index.test.js.map