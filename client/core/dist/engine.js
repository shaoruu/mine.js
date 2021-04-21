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
exports.__esModule = true;
exports.Engine = void 0;
var events_1 = require("events");
var deepmerge_1 = require("deepmerge");
var libs_1 = require("../libs");
var _1 = require(".");
var defaultConfig = {
    debug: true,
    container: {
        canvas: undefined,
        domElement: undefined
    },
    camera: {
        fov: 75,
        near: 0.1,
        far: 8000,
        initPos: [10, 20, 10],
        minPolarAngle: 0,
        maxPolarAngle: Math.PI,
        acceleration: 1,
        flyingInertia: 3,
        reachDistance: 32,
        lookBlockScale: 1.02,
        lookBlockLerp: 0.7,
        distToGround: 1.6,
        distToTop: 0.2,
        cameraWidth: 0.8
    },
    world: {
        maxHeight: 256,
        generator: '',
        renderRadius: 8,
        chunkSize: 16,
        dimension: 1,
        // radius of rendering centered by camera
        // maximum amount of chunks to process per frame tick
        maxChunkPerFrame: 2,
        maxBlockPerFrame: 500
    },
    entities: {
        movementLerp: true,
        movementLerpFactor: 0.4,
        maxEntities: 1000
    },
    physics: {
        gravity: [0, -24, 0],
        minBounceImpulse: 0.5,
        airDrag: 0.1,
        fluidDrag: 0.4,
        fluidDensity: 2.0
    },
    registry: {
        textureWidth: 32
    },
    rendering: {
        fogColor: '#ffffff',
        clearColor: '#b6d2ff'
    },
    network: {
        url: "http://" + window.location.hostname + (window.location.hostname === 'localhost' ? ':4000' : window.location.port ? ":" + window.location.port : '')
    }
};
var Engine = /** @class */ (function (_super) {
    __extends(Engine, _super);
    function Engine(params) {
        if (params === void 0) { params = {}; }
        var _this = _super.call(this) || this;
        _this.paused = true;
        _this.boot = function () {
            var cycle = function () {
                if (_this.debug) {
                    _this.debug.stats.begin();
                }
                _this.tick();
                _this.render();
                if (_this.debug) {
                    _this.debug.stats.end();
                }
                requestAnimationFrame(cycle);
            };
            cycle();
        };
        _this.tick = function () {
            if (_this.paused)
                return;
            _this.emit('tick-begin');
            // pre-ticks for before physics
            _this.entities.preTick();
            _this.clock.tick();
            _this.camera.tick();
            _this.physics.tick();
            _this.entities.tick();
            _this.world.tick();
            _this.rendering.tick();
            if (_this.debug) {
                _this.debug.tick();
            }
            _this.emit('tick-end');
        };
        _this.render = function () {
            _this.rendering.render();
        };
        _this.start = function () {
            _this.paused = false;
            _this.emit('start');
        };
        _this.pause = function () {
            _this.paused = true;
            _this.emit('pause');
        };
        var _a = (_this.config = deepmerge_1["default"](defaultConfig, params)), debug = _a.debug, camera = _a.camera, container = _a.container, entities = _a.entities, physics = _a.physics, registry = _a.registry, rendering = _a.rendering, world = _a.world, network = _a.network;
        // debug
        if (debug) {
            _this.debug = new _1.Debug(_this);
        }
        // network
        _this.network = new _1.Network(_this, network);
        // container
        _this.container = new _1.Container(_this, container);
        // registry
        _this.registry = new _1.Registry(_this, registry);
        // rendering
        _this.rendering = new _1.Rendering(_this, rendering);
        // inputs
        _this.inputs = new _1.Inputs(_this);
        // camera
        _this.camera = new _1.Camera(_this, camera);
        // world
        _this.world = new _1.World(_this, world);
        // physics
        _this.physics = new _1.Physics(_this, physics);
        // entities
        _this.entities = new _1.Entities(_this, entities);
        // time
        _this.clock = new libs_1.Clock();
        _this.boot();
        _this.emit('ready');
        return _this;
    }
    Object.defineProperty(Engine.prototype, "isLocked", {
        // if pointerlock is locked
        get: function () {
            return this.camera.controls.isLocked;
        },
        enumerable: false,
        configurable: true
    });
    return Engine;
}(events_1.EventEmitter));
exports.Engine = Engine;
