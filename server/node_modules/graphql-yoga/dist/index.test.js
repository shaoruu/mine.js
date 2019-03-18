"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var graphql_deduplicator_1 = require("graphql-deduplicator");
var index_1 = require("./index");
var util_1 = require("util");
var graphql_middleware_1 = require("graphql-middleware");
var request = require("request-promise-native");
function startServer(t, options) {
    return __awaiter(this, void 0, void 0, function () {
        var randomId, typeDefs, author, book, resolvers, server, http, port, uri;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    randomId = function () {
                        return Math.random()
                            .toString(36)
                            .substr(2, 5);
                    };
                    typeDefs = "\n    type Author {\n      id: ID!\n      name: String!\n      lastName: String!\n    }\n\n    type Book {\n      id: ID!\n      name: String!\n      author: Author!\n    }\n\n    type Query {\n      hello(name: String): String!\n      books: [Book!]!\n    }\n    ";
                    author = {
                        __typename: 'Author',
                        id: randomId(),
                        name: 'Jhon',
                        lastName: 'Doe',
                    };
                    book = {
                        __typename: 'Book',
                        id: randomId(),
                        name: 'Awesome',
                        author: author,
                    };
                    resolvers = {
                        Query: {
                            hello: function (_, _a) {
                                var name = _a.name;
                                return "Hello " + (name || 'World');
                            },
                            books: function () { return Array(5).fill(book); },
                        },
                    };
                    server = new index_1.GraphQLServer({ typeDefs: typeDefs, resolvers: resolvers });
                    return [4 /*yield*/, server.start(__assign({ port: 0 }, options))];
                case 1:
                    http = _a.sent();
                    port = http.address().port;
                    uri = "http://localhost:" + port + "/";
                    if (t.context.httpServers) {
                        t.context.httpServers.push(http);
                    }
                    else {
                        t.context.httpServers = [http];
                    }
                    t.context.uri = uri;
                    t.context.data = { book: book };
                    return [2 /*return*/, t.context];
            }
        });
    });
}
ava_1.default.afterEach.always('stop graphql servers', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var httpServers;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                httpServers = t.context.httpServers;
                if (!(httpServers && httpServers.length)) return [3 /*break*/, 2];
                return [4 /*yield*/, Promise.all(httpServers.map(function (server) { return util_1.promisify(server.close).call(server); }))];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
ava_1.default('works with simple hello world server', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var uri, query, body;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, startServer(t)];
            case 1:
                uri = (_a.sent()).uri;
                query = "\n    query {\n        hello(name: \"Sarah\")\n    }\n  ";
                return [4 /*yield*/, request({
                        uri: uri,
                        method: 'POST',
                        json: true,
                        body: { query: query },
                    }).promise()];
            case 2:
                body = _a.sent();
                t.deepEqual(body, {
                    data: {
                        hello: 'Hello Sarah',
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Response data can be deduplicated with graphql-deduplicator', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var _a, uri, book, query, body, deduplicated;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, startServer(t)];
            case 1:
                _a = _b.sent(), uri = _a.uri, book = _a.data.book;
                query = "\n    query {\n      books {\n        __typename\n        id\n        name\n        author {\n          __typename\n          id\n          name\n          lastName\n        }\n      }\n    }\n  ";
                return [4 /*yield*/, request({
                        uri: uri,
                        method: 'POST',
                        json: true,
                        body: { query: query },
                    }).promise()];
            case 2:
                body = _b.sent();
                return [4 /*yield*/, request({
                        uri: uri,
                        method: 'POST',
                        json: true,
                        body: { query: query },
                        headers: {
                            'X-GraphQL-Deduplicate': true,
                        },
                    }).promise()];
            case 3:
                deduplicated = _b.sent();
                t.deepEqual(body, {
                    data: {
                        books: Array(5).fill(book),
                    },
                });
                t.deepEqual(deduplicated, {
                    data: {
                        books: [
                            book
                        ].concat(Array(4).fill({
                            __typename: book.__typename,
                            id: book.id,
                        })),
                    },
                });
                t.deepEqual(body.data, graphql_deduplicator_1.inflate(deduplicated.data));
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('graphql-deduplicated can be completely disabled', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var _a, uri, book, query, body;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, startServer(t, {
                    deduplicator: false,
                })];
            case 1:
                _a = _b.sent(), uri = _a.uri, book = _a.data.book;
                query = "\n    query {\n      books {\n        __typename\n        id\n        name\n        author {\n          __typename\n          id\n          name\n          lastName\n        }\n      }\n    }\n  ";
                return [4 /*yield*/, request({
                        uri: uri,
                        method: 'POST',
                        json: true,
                        body: { query: query },
                        headers: {
                            'X-GraphQL-Deduplicate': true,
                        },
                    }).promise()];
            case 2:
                body = _b.sent();
                t.deepEqual(body, {
                    data: {
                        books: Array(5).fill(book),
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Works with graphql-middleware', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var typeDefs, resolvers, middleware, server, http, port, uri, query, body;
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                typeDefs = "\n    type Book {\n      id: ID!\n      name: String!\n      author: String!\n    }\n\n    type Query {\n      book: Book!\n    }\n  ";
                resolvers = {
                    Query: {
                        book: function () { return ({
                            id: 'id',
                            name: 'name',
                            author: 'author',
                        }); },
                    },
                };
                middleware = function (resolve, parent, args, ctx, info) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        return [2 /*return*/, 'pass'];
                    });
                }); };
                server = new index_1.GraphQLServer({
                    typeDefs: typeDefs,
                    resolvers: resolvers,
                    middlewares: [middleware],
                });
                return [4 /*yield*/, server.start({ port: 0 })];
            case 1:
                http = _a.sent();
                port = http.address().port;
                uri = "http://localhost:" + port + "/";
                query = "\n    query {\n      book {\n        id\n        name\n        author\n      }\n    }\n  ";
                return [4 /*yield*/, request({
                        uri: uri,
                        method: 'POST',
                        json: true,
                        body: { query: query },
                    }).promise()];
            case 2:
                body = _a.sent();
                t.deepEqual(body, {
                    data: {
                        book: {
                            id: 'pass',
                            name: 'pass',
                            author: 'pass',
                        },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Works with graphql-middleware generator.', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var typeDefs, resolvers, middlewareGenerator, server, http, port, uri, query, body;
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                typeDefs = "\n    type Book {\n      id: ID!\n      name: String!\n      author: String!\n    }\n\n    type Query {\n      book: Book!\n    }\n  ";
                resolvers = {
                    Query: {
                        book: function () { return ({
                            id: 'id',
                            name: 'name',
                            author: 'author',
                        }); },
                    },
                };
                middlewareGenerator = graphql_middleware_1.middleware(function (schema) {
                    return function (resolve, parent, args, ctx, info) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, 'pass'];
                        });
                    }); };
                });
                server = new index_1.GraphQLServer({
                    typeDefs: typeDefs,
                    resolvers: resolvers,
                    middlewares: [middlewareGenerator],
                });
                return [4 /*yield*/, server.start({ port: 0 })];
            case 1:
                http = _a.sent();
                port = http.address().port;
                uri = "http://localhost:" + port + "/";
                query = "\n    query {\n      book {\n        id\n        name\n        author\n      }\n    }\n  ";
                return [4 /*yield*/, request({
                        uri: uri,
                        method: 'POST',
                        json: true,
                        body: { query: query },
                    }).promise()];
            case 2:
                body = _a.sent();
                t.deepEqual(body, {
                    data: {
                        book: {
                            id: 'pass',
                            name: 'pass',
                            author: 'pass',
                        },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
ava_1.default('Works with array of resolvers', function (t) { return __awaiter(_this, void 0, void 0, function () {
    var typeDefs, queryResolver, bookIdResolver, bookNameResolver, server, http, port, uri, query, body;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                typeDefs = "\n    type Book {\n      id: ID!\n      name: String!\n      author: String!\n    }\n\n    type Query {\n      book: Book!\n    }\n  ";
                queryResolver = {
                    Query: {
                        book: function () { return ({
                            id: 'id',
                            name: 'name',
                            author: 'author',
                        }); },
                    },
                };
                bookIdResolver = {
                    Book: {
                        id: function (root) { return "book-" + root.id; },
                    },
                };
                bookNameResolver = {
                    Book: {
                        name: function (root) { return "book-" + root.name; },
                    },
                };
                server = new index_1.GraphQLServer({
                    typeDefs: typeDefs,
                    resolvers: [queryResolver, bookIdResolver, bookNameResolver],
                    middlewares: [],
                });
                return [4 /*yield*/, server.start({ port: 0 })];
            case 1:
                http = _a.sent();
                port = http.address().port;
                uri = "http://localhost:" + port + "/";
                query = "\n    query {\n      book {\n        id\n        name\n        author\n      }\n    }\n  ";
                return [4 /*yield*/, request({
                        uri: uri,
                        method: 'POST',
                        json: true,
                        body: { query: query },
                    }).promise()];
            case 2:
                body = _a.sent();
                t.deepEqual(body, {
                    data: {
                        book: {
                            id: 'book-id',
                            name: 'book-name',
                            author: 'author',
                        },
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=index.test.js.map