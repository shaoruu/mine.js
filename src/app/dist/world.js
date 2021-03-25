"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.World = void 0;
var events_1 = require("events");
var libs_1 = require("../libs");
var utils_1 = require("../utils");
var chunk_1 = require("./chunk");
var World = /** @class */ (function (_super) {
    __extends(World, _super);
    function World(engine, options) {
        var _this = _super.call(this) || this;
        _this.isReady = false;
        _this.chunks = new libs_1.SmartDictionary();
        _this.dirtyChunks = []; // chunks that are freshly made
        _this.visibleChunks = [];
        _this.batchedChanges = [];
        _this.options = __assign({}, options);
        var generator = _this.options.generator;
        _this.engine = engine;
        switch (generator) {
            case 'flat':
                _this.generator = new libs_1.FlatGenerator(_this.engine);
                break;
            case 'sin-cos':
                _this.generator = new libs_1.SinCosGenerator(_this.engine);
        }
        return _this;
    }
    World.prototype.tick = function () {
        var _this = this;
        // Check camera position
        this.checkCamChunk();
        this.meshDirtyChunks();
        var toBeChanged = this.batchedChanges.splice(0, this.options.maxBlockPerFrame);
        var lightPlacement = [];
        var lightRemoval = [];
        toBeChanged.forEach(function (_a) {
            var voxel = _a.voxel, type = _a.type;
            var chunk = _this.getChunkByVoxel(voxel);
            chunk === null || chunk === void 0 ? void 0 : chunk.setVoxel.apply(chunk, __spreadArrays(voxel, [type]));
            var neighborChunks = _this.getNeighborChunksByVoxel(voxel);
            neighborChunks.forEach(function (c) { return c === null || c === void 0 ? void 0 : c.setVoxel.apply(c, __spreadArrays(voxel, [type])); });
            var lightLevel = _this.engine.registry.getLightByIndex(type);
            // lighting
            if (lightLevel > 0) {
                lightPlacement.push({ voxel: voxel, level: lightLevel });
            }
            else {
                var blockLight = _this.getTorchLight(voxel);
                var supposedLight = _this.engine.registry.getLightByIndex(Number(_this.getVoxelByVoxel(voxel)));
                if (blockLight > 0) {
                    lightRemoval.push({ voxel: voxel, level: blockLight });
                }
                else if (supposedLight !== undefined) {
                    lightRemoval.push({ voxel: voxel, level: supposedLight });
                }
            }
        });
        if (lightRemoval.length !== 0) {
            console.log(lightRemoval.map(function (e) { return e; }));
        }
        this.propagateLightQueue(lightPlacement);
        this.removeTorchLights(lightRemoval);
    };
    World.prototype.getChunkByCPos = function (cCoords) {
        return this.getChunkByName(utils_1.Helper.getChunkName(cCoords));
    };
    World.prototype.getChunkByName = function (chunkName) {
        return this.chunks.get(chunkName);
    };
    World.prototype.getChunkByVoxel = function (vCoords) {
        var chunkSize = this.options.chunkSize;
        var chunkCoords = utils_1.Helper.mapVoxelPosToChunkPos(vCoords, chunkSize);
        return this.getChunkByCPos(chunkCoords);
    };
    World.prototype.getNeighborChunksByVoxel = function (vCoords, padding) {
        if (padding === void 0) { padding = this.options.chunkPadding; }
        var chunkSize = this.options.chunkSize;
        var _a = utils_1.Helper.mapVoxelPosToChunkPos(vCoords, chunkSize), cx = _a[0], cy = _a[1], cz = _a[2];
        var _b = utils_1.Helper.mapVoxelPosToChunkLocalPos(vCoords, chunkSize), lx = _b[0], ly = _b[1], lz = _b[2];
        var neighborChunks = [];
        // check if local position is on the edge
        // TODO: fix this hacky way of doing so.
        var a = lx < padding;
        var b = ly < padding;
        var c = lz < padding;
        var d = lx >= chunkSize - padding;
        var e = ly >= chunkSize - padding;
        var f = lz >= chunkSize - padding;
        // direct neighbors
        if (a)
            neighborChunks.push(this.getChunkByCPos([cx - 1, cy, cz]));
        if (b)
            neighborChunks.push(this.getChunkByCPos([cx, cy - 1, cz]));
        if (c)
            neighborChunks.push(this.getChunkByCPos([cx, cy, cz - 1]));
        if (d)
            neighborChunks.push(this.getChunkByCPos([cx + 1, cy, cz]));
        if (e)
            neighborChunks.push(this.getChunkByCPos([cx, cy + 1, cz]));
        if (f)
            neighborChunks.push(this.getChunkByCPos([cx, cy, cz + 1]));
        // side-to-side diagonals
        if (a && b)
            neighborChunks.push(this.getChunkByCPos([cx - 1, cy - 1, cz]));
        if (a && c)
            neighborChunks.push(this.getChunkByCPos([cx - 1, cy, cz - 1]));
        if (a && e)
            neighborChunks.push(this.getChunkByCPos([cx - 1, cy + 1, cz]));
        if (a && f)
            neighborChunks.push(this.getChunkByCPos([cx - 1, cy, cz + 1]));
        if (b && c)
            neighborChunks.push(this.getChunkByCPos([cx, cy - 1, cz - 1]));
        if (b && d)
            neighborChunks.push(this.getChunkByCPos([cx + 1, cy - 1, cz]));
        if (b && f)
            neighborChunks.push(this.getChunkByCPos([cx, cy - 1, cz + 1]));
        if (c && d)
            neighborChunks.push(this.getChunkByCPos([cx + 1, cy, cz - 1]));
        if (c && e)
            neighborChunks.push(this.getChunkByCPos([cx, cy + 1, cz - 1]));
        if (d && e)
            neighborChunks.push(this.getChunkByCPos([cx + 1, cy + 1, cz]));
        if (d && f)
            neighborChunks.push(this.getChunkByCPos([cx + 1, cy, cz + 1]));
        if (e && f)
            neighborChunks.push(this.getChunkByCPos([cx, cy + 1, cz + 1]));
        // direct diagonals
        if (a && b && c)
            neighborChunks.push(this.getChunkByCPos([cx - 1, cy - 1, cz - 1]));
        if (a && b && f)
            neighborChunks.push(this.getChunkByCPos([cx - 1, cy - 1, cz + 1]));
        if (a && c && e)
            neighborChunks.push(this.getChunkByCPos([cx - 1, cy + 1, cz - 1]));
        if (a && e && f)
            neighborChunks.push(this.getChunkByCPos([cx - 1, cy + 1, cz + 1]));
        if (b && c && d)
            neighborChunks.push(this.getChunkByCPos([cx + 1, cy - 1, cz - 1]));
        if (b && d && f)
            neighborChunks.push(this.getChunkByCPos([cx + 1, cy - 1, cz + 1]));
        if (c && d && e)
            neighborChunks.push(this.getChunkByCPos([cx + 1, cy + 1, cz - 1]));
        if (d && e && f)
            neighborChunks.push(this.getChunkByCPos([cx + 1, cy + 1, cz + 1]));
        return neighborChunks.filter(Boolean);
    };
    World.prototype.getVoxelByVoxel = function (vCoords) {
        var chunk = this.getChunkByVoxel(vCoords);
        return chunk ? chunk.getVoxel.apply(chunk, vCoords) : null;
    };
    World.prototype.getVoxelByWorld = function (wCoords) {
        var vCoords = utils_1.Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
        return this.getVoxelByVoxel(vCoords);
    };
    World.prototype.getSolidityByVoxel = function (vCoords) {
        return this.getVoxelByVoxel(vCoords) !== 0;
    };
    World.prototype.getFluidityByVoxel = function (vCoords) {
        // TODO
        return false;
    };
    World.prototype.getSolidityByWorld = function (wCoords) {
        var vCoords = utils_1.Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
        return this.getSolidityByVoxel(vCoords);
    };
    World.prototype.getFluidityByWorld = function (wCoords) {
        var vCoords = utils_1.Helper.mapWorldPosToVoxelPos(wCoords, this.options.dimension);
        return this.getFluidityByVoxel(vCoords);
    };
    World.prototype.setChunk = function (chunk) {
        return this.chunks.set(chunk.name, chunk);
    };
    World.prototype.setVoxel = function (vCoords, type) {
        this.batchedChanges.push({
            voxel: vCoords,
            type: type
        });
    };
    World.prototype.breakVoxel = function () {
        if (this.engine.camera.lookBlock) {
            this.setVoxel(this.engine.camera.lookBlock, 0);
        }
    };
    World.prototype.placeVoxel = function (type) {
        if (this.engine.camera.targetBlock) {
            this.setVoxel(this.engine.camera.targetBlock, type);
        }
    };
    World.prototype.getTorchLight = function (vCoords) {
        var chunk = this.getChunkByVoxel(vCoords);
        return (chunk === null || chunk === void 0 ? void 0 : chunk.getTorchLight.apply(chunk, vCoords)) || 0;
    };
    World.prototype.setTorchLight = function (vCoords, level) {
        var chunk = this.getChunkByVoxel(vCoords);
        chunk === null || chunk === void 0 ? void 0 : chunk.setTorchLight.apply(chunk, __spreadArrays(vCoords, [level]));
        var neighborChunks = this.getNeighborChunksByVoxel(vCoords);
        neighborChunks.forEach(function (c) { return c === null || c === void 0 ? void 0 : c.setTorchLight.apply(c, __spreadArrays(vCoords, [level])); });
    };
    // resource: https://www.seedofandromeda.com/blogs/29-fast-flood-fill-lighting-in-a-blocky-voxel-game-pt-1
    World.prototype.removeTorchLights = function (lightRemovalBfsQueue) {
        // flood-fill lighting removal
        var _this = this;
        // lightRemovalBfsQueue = lightRemovalBfsQueue.filter(({ voxel }) => this.getVoxelByVoxel(voxel) === 0);
        // from high to low
        lightRemovalBfsQueue.sort(function (a, b) { return b.level - a.level; });
        var lightBfsQueue = [];
        var _loop_1 = function () {
            var lightNode = lightRemovalBfsQueue.shift();
            if (lightNode) {
                var level_1 = lightNode.level, voxel = lightNode.voxel;
                var vx_1 = voxel[0], vy_1 = voxel[1], vz_1 = voxel[2];
                var directions = [
                    [1, 0, 0],
                    [-1, 0, 0],
                    [0, 1, 0],
                    [0, -1, 0],
                    [0, 0, 1],
                    [0, 0, -1],
                ];
                this_1.setTorchLight(voxel, 0);
                directions.forEach(function (_a) {
                    var dirX = _a[0], dirY = _a[1], dirZ = _a[2];
                    var newVX = vx_1 + dirX;
                    var newVY = vy_1 + dirY;
                    var newVZ = vz_1 + dirZ;
                    var neighborLevel = _this.getTorchLight([newVX, newVY, newVZ]);
                    if (neighborLevel !== 0 && neighborLevel < level_1) {
                        _this.setTorchLight([newVX, newVY, newVZ], 0);
                        lightRemovalBfsQueue.push({
                            level: neighborLevel,
                            voxel: [newVX, newVY, newVZ]
                        });
                    }
                    else if (neighborLevel >= level_1) {
                        lightBfsQueue.push({
                            level: neighborLevel,
                            voxel: [newVX, newVY, newVZ]
                        });
                    }
                });
            }
        };
        var this_1 = this;
        while (lightRemovalBfsQueue.length !== 0) {
            _loop_1();
        }
        this.propagateLightQueue(lightBfsQueue);
    };
    World.prototype.propagateLightQueue = function (lightQueue) {
        var _this = this;
        var _loop_2 = function () {
            var lightNode = lightQueue.shift();
            if (lightNode) {
                var level_2 = lightNode.level, voxel = lightNode.voxel;
                var vx_2 = voxel[0], vy_2 = voxel[1], vz_2 = voxel[2];
                this_2.setTorchLight(voxel, level_2);
                // 6 directions, representing the 6 faces of a block
                var directions = [
                    [1, 0, 0],
                    [-1, 0, 0],
                    [0, 1, 0],
                    [0, -1, 0],
                    [0, 0, 1],
                    [0, 0, -1],
                ];
                directions.forEach(function (_a) {
                    var dirX = _a[0], dirY = _a[1], dirZ = _a[2];
                    // neighboring voxel coordinates
                    var newVX = vx_2 + dirX;
                    var newVY = vy_2 + dirY;
                    var newVZ = vz_2 + dirZ;
                    if (_this.getVoxelByVoxel([newVX, newVY, newVZ]) === 0 &&
                        _this.getTorchLight([newVX, newVY, newVZ]) + 2 <= level_2) {
                        _this.setTorchLight([newVX, newVY, newVZ], level_2 - 1);
                        lightQueue.push({
                            level: level_2 - 1,
                            voxel: [newVX, newVY, newVZ]
                        });
                    }
                });
            }
        };
        var this_2 = this;
        // console.time('propagation');
        while (lightQueue.length !== 0) {
            _loop_2();
        }
        // console.timeEnd('propagation');
    };
    World.prototype.addAsVisible = function (chunk) {
        this.visibleChunks.push(chunk);
    };
    World.prototype.removeAsVisible = function (chunk) {
        this.visibleChunks.splice(this.visibleChunks.indexOf(chunk), 1);
    };
    Object.defineProperty(World.prototype, "camChunkPosStr", {
        get: function () {
            return this.camChunkPos[0] + " " + this.camChunkPos[1] + " " + this.camChunkPos[2];
        },
        enumerable: false,
        configurable: true
    });
    World.prototype.checkCamChunk = function () {
        var _a = this.options, chunkSize = _a.chunkSize, renderRadius = _a.renderRadius;
        var pos = this.engine.camera.voxel;
        var chunkPos = utils_1.Helper.mapVoxelPosToChunkPos(pos, chunkSize);
        var chunkName = utils_1.Helper.getChunkName(chunkPos);
        if (chunkName !== this.camChunkName) {
            this.engine.emit('chunk-changed', chunkPos);
            this.camChunkName = chunkName;
            this.camChunkPos = chunkPos;
            this.surroundCamChunks();
        }
        var chunksLoaded = 0;
        var _b = this.camChunkPos, cx = _b[0], cy = _b[1], cz = _b[2];
        for (var x = cx - renderRadius; x <= cx + renderRadius; x++) {
            for (var y = cy - renderRadius; y <= cy + renderRadius; y++) {
                for (var z = cz - renderRadius; z <= cz + renderRadius; z++) {
                    var dx = x - cx;
                    var dy = y - cy;
                    var dz = z - cz;
                    // sphere of chunks around camera effect
                    if (dx * dx + dy * dy + dz * dz > renderRadius * renderRadius)
                        continue;
                    var chunk = this.getChunkByCPos([x, y, z]);
                    if (chunk) {
                        if (chunk.isInitialized) {
                            chunksLoaded++;
                            if (!chunk.isDirty) {
                                if (!chunk.isAdded) {
                                    chunk.addToScene();
                                }
                            }
                            else {
                                // this means chunk is dirty. two possibilities:
                                // 1. chunk has just been populated with terrain data
                                // 2. chunk is modified
                                if (!chunk.isMeshing) {
                                    chunk.buildMesh();
                                }
                            }
                        }
                    }
                }
            }
        }
        if (chunksLoaded === this.chunks.data.length) {
            this.isReady = true;
            this.engine.emit('world-ready');
        }
    };
    World.prototype.surroundCamChunks = function () {
        var _a = this.options, renderRadius = _a.renderRadius, dimension = _a.dimension, chunkSize = _a.chunkSize, chunkPadding = _a.chunkPadding;
        var _b = this.camChunkPos, cx = _b[0], cy = _b[1], cz = _b[2];
        for (var x = cx - renderRadius; x <= cx + renderRadius; x++) {
            for (var y = cy - renderRadius; y <= cy + renderRadius; y++) {
                for (var z = cz - renderRadius; z <= cz + renderRadius; z++) {
                    var dx = x - cx;
                    var dy = y - cy;
                    var dz = z - cz;
                    if (dx * dx + dy * dy + dz * dz > renderRadius * renderRadius)
                        continue;
                    var chunk = this.getChunkByCPos([x, y, z]);
                    if (!chunk) {
                        var newChunk = new chunk_1.Chunk(this.engine, [x, y, z], { size: chunkSize, dimension: dimension, padding: chunkPadding });
                        this.setChunk(newChunk);
                        this.dirtyChunks.push(newChunk);
                    }
                }
            }
        }
        // if the chunk is too far away, remove from scene.
        var deleteDistance = renderRadius * chunkSize * dimension;
        for (var _i = 0, _c = this.visibleChunks; _i < _c.length; _i++) {
            var chunk = _c[_i];
            if (chunk.distTo.apply(chunk, this.engine.camera.voxel) > deleteDistance) {
                chunk.removeFromScene();
            }
        }
    };
    World.prototype.meshDirtyChunks = function () {
        if (this.dirtyChunks.length > 0) {
            var count = 0;
            while (count <= this.options.maxChunkPerFrame && this.dirtyChunks.length > 0) {
                count++;
                var chunk = this.dirtyChunks.shift();
                if (!chunk)
                    break; // array is empty?
                // chunk needs to be populated with terrain data
                // `isInitialized` will be switched to true once terrain data is set
                this.requestChunkData(chunk);
                continue;
            }
        }
    };
    World.prototype.requestChunkData = function (chunk) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.generator) {
                            // client side terrain generation, call chunk.initialized once finished.
                            // assume the worst, say the chunk is not empty
                            chunk.isEmpty = false;
                            chunk.isPending = true;
                            this.engine.emit('data-needed', chunk);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.generator.generate(chunk)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, chunk.initialized()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return World;
}(events_1.EventEmitter));
exports.World = World;
