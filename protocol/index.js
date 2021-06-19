/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.protocol = (function() {

    /**
     * Namespace protocol.
     * @exports protocol
     * @namespace
     */
    var protocol = {};

    protocol.Geometry = (function() {

        /**
         * Properties of a Geometry.
         * @memberof protocol
         * @interface IGeometry
         * @property {Array.<number>|null} [torchLights] Geometry torchLights
         * @property {Array.<number>|null} [sunlights] Geometry sunlights
         * @property {Array.<number>|null} [indices] Geometry indices
         * @property {Array.<number>|null} [positions] Geometry positions
         * @property {Array.<number>|null} [uvs] Geometry uvs
         * @property {Array.<number>|null} [aos] Geometry aos
         */

        /**
         * Constructs a new Geometry.
         * @memberof protocol
         * @classdesc Represents a Geometry.
         * @implements IGeometry
         * @constructor
         * @param {protocol.IGeometry=} [properties] Properties to set
         */
        function Geometry(properties) {
            this.torchLights = [];
            this.sunlights = [];
            this.indices = [];
            this.positions = [];
            this.uvs = [];
            this.aos = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Geometry torchLights.
         * @member {Array.<number>} torchLights
         * @memberof protocol.Geometry
         * @instance
         */
        Geometry.prototype.torchLights = $util.emptyArray;

        /**
         * Geometry sunlights.
         * @member {Array.<number>} sunlights
         * @memberof protocol.Geometry
         * @instance
         */
        Geometry.prototype.sunlights = $util.emptyArray;

        /**
         * Geometry indices.
         * @member {Array.<number>} indices
         * @memberof protocol.Geometry
         * @instance
         */
        Geometry.prototype.indices = $util.emptyArray;

        /**
         * Geometry positions.
         * @member {Array.<number>} positions
         * @memberof protocol.Geometry
         * @instance
         */
        Geometry.prototype.positions = $util.emptyArray;

        /**
         * Geometry uvs.
         * @member {Array.<number>} uvs
         * @memberof protocol.Geometry
         * @instance
         */
        Geometry.prototype.uvs = $util.emptyArray;

        /**
         * Geometry aos.
         * @member {Array.<number>} aos
         * @memberof protocol.Geometry
         * @instance
         */
        Geometry.prototype.aos = $util.emptyArray;

        /**
         * Creates a new Geometry instance using the specified properties.
         * @function create
         * @memberof protocol.Geometry
         * @static
         * @param {protocol.IGeometry=} [properties] Properties to set
         * @returns {protocol.Geometry} Geometry instance
         */
        Geometry.create = function create(properties) {
            return new Geometry(properties);
        };

        /**
         * Encodes the specified Geometry message. Does not implicitly {@link protocol.Geometry.verify|verify} messages.
         * @function encode
         * @memberof protocol.Geometry
         * @static
         * @param {protocol.IGeometry} message Geometry message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Geometry.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.torchLights != null && message.torchLights.length) {
                writer.uint32(/* id 1, wireType 2 =*/10).fork();
                for (var i = 0; i < message.torchLights.length; ++i)
                    writer.int32(message.torchLights[i]);
                writer.ldelim();
            }
            if (message.sunlights != null && message.sunlights.length) {
                writer.uint32(/* id 2, wireType 2 =*/18).fork();
                for (var i = 0; i < message.sunlights.length; ++i)
                    writer.int32(message.sunlights[i]);
                writer.ldelim();
            }
            if (message.indices != null && message.indices.length) {
                writer.uint32(/* id 3, wireType 2 =*/26).fork();
                for (var i = 0; i < message.indices.length; ++i)
                    writer.int32(message.indices[i]);
                writer.ldelim();
            }
            if (message.positions != null && message.positions.length) {
                writer.uint32(/* id 4, wireType 2 =*/34).fork();
                for (var i = 0; i < message.positions.length; ++i)
                    writer.float(message.positions[i]);
                writer.ldelim();
            }
            if (message.uvs != null && message.uvs.length) {
                writer.uint32(/* id 6, wireType 2 =*/50).fork();
                for (var i = 0; i < message.uvs.length; ++i)
                    writer.float(message.uvs[i]);
                writer.ldelim();
            }
            if (message.aos != null && message.aos.length) {
                writer.uint32(/* id 7, wireType 2 =*/58).fork();
                for (var i = 0; i < message.aos.length; ++i)
                    writer.float(message.aos[i]);
                writer.ldelim();
            }
            return writer;
        };

        /**
         * Encodes the specified Geometry message, length delimited. Does not implicitly {@link protocol.Geometry.verify|verify} messages.
         * @function encodeDelimited
         * @memberof protocol.Geometry
         * @static
         * @param {protocol.IGeometry} message Geometry message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Geometry.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Geometry message from the specified reader or buffer.
         * @function decode
         * @memberof protocol.Geometry
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {protocol.Geometry} Geometry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Geometry.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.protocol.Geometry();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.torchLights && message.torchLights.length))
                        message.torchLights = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.torchLights.push(reader.int32());
                    } else
                        message.torchLights.push(reader.int32());
                    break;
                case 2:
                    if (!(message.sunlights && message.sunlights.length))
                        message.sunlights = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.sunlights.push(reader.int32());
                    } else
                        message.sunlights.push(reader.int32());
                    break;
                case 3:
                    if (!(message.indices && message.indices.length))
                        message.indices = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.indices.push(reader.int32());
                    } else
                        message.indices.push(reader.int32());
                    break;
                case 4:
                    if (!(message.positions && message.positions.length))
                        message.positions = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.positions.push(reader.float());
                    } else
                        message.positions.push(reader.float());
                    break;
                case 6:
                    if (!(message.uvs && message.uvs.length))
                        message.uvs = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.uvs.push(reader.float());
                    } else
                        message.uvs.push(reader.float());
                    break;
                case 7:
                    if (!(message.aos && message.aos.length))
                        message.aos = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.aos.push(reader.float());
                    } else
                        message.aos.push(reader.float());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Geometry message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof protocol.Geometry
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {protocol.Geometry} Geometry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Geometry.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Geometry message.
         * @function verify
         * @memberof protocol.Geometry
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Geometry.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.torchLights != null && message.hasOwnProperty("torchLights")) {
                if (!Array.isArray(message.torchLights))
                    return "torchLights: array expected";
                for (var i = 0; i < message.torchLights.length; ++i)
                    if (!$util.isInteger(message.torchLights[i]))
                        return "torchLights: integer[] expected";
            }
            if (message.sunlights != null && message.hasOwnProperty("sunlights")) {
                if (!Array.isArray(message.sunlights))
                    return "sunlights: array expected";
                for (var i = 0; i < message.sunlights.length; ++i)
                    if (!$util.isInteger(message.sunlights[i]))
                        return "sunlights: integer[] expected";
            }
            if (message.indices != null && message.hasOwnProperty("indices")) {
                if (!Array.isArray(message.indices))
                    return "indices: array expected";
                for (var i = 0; i < message.indices.length; ++i)
                    if (!$util.isInteger(message.indices[i]))
                        return "indices: integer[] expected";
            }
            if (message.positions != null && message.hasOwnProperty("positions")) {
                if (!Array.isArray(message.positions))
                    return "positions: array expected";
                for (var i = 0; i < message.positions.length; ++i)
                    if (typeof message.positions[i] !== "number")
                        return "positions: number[] expected";
            }
            if (message.uvs != null && message.hasOwnProperty("uvs")) {
                if (!Array.isArray(message.uvs))
                    return "uvs: array expected";
                for (var i = 0; i < message.uvs.length; ++i)
                    if (typeof message.uvs[i] !== "number")
                        return "uvs: number[] expected";
            }
            if (message.aos != null && message.hasOwnProperty("aos")) {
                if (!Array.isArray(message.aos))
                    return "aos: array expected";
                for (var i = 0; i < message.aos.length; ++i)
                    if (typeof message.aos[i] !== "number")
                        return "aos: number[] expected";
            }
            return null;
        };

        /**
         * Creates a Geometry message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof protocol.Geometry
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {protocol.Geometry} Geometry
         */
        Geometry.fromObject = function fromObject(object) {
            if (object instanceof $root.protocol.Geometry)
                return object;
            var message = new $root.protocol.Geometry();
            if (object.torchLights) {
                if (!Array.isArray(object.torchLights))
                    throw TypeError(".protocol.Geometry.torchLights: array expected");
                message.torchLights = [];
                for (var i = 0; i < object.torchLights.length; ++i)
                    message.torchLights[i] = object.torchLights[i] | 0;
            }
            if (object.sunlights) {
                if (!Array.isArray(object.sunlights))
                    throw TypeError(".protocol.Geometry.sunlights: array expected");
                message.sunlights = [];
                for (var i = 0; i < object.sunlights.length; ++i)
                    message.sunlights[i] = object.sunlights[i] | 0;
            }
            if (object.indices) {
                if (!Array.isArray(object.indices))
                    throw TypeError(".protocol.Geometry.indices: array expected");
                message.indices = [];
                for (var i = 0; i < object.indices.length; ++i)
                    message.indices[i] = object.indices[i] | 0;
            }
            if (object.positions) {
                if (!Array.isArray(object.positions))
                    throw TypeError(".protocol.Geometry.positions: array expected");
                message.positions = [];
                for (var i = 0; i < object.positions.length; ++i)
                    message.positions[i] = Number(object.positions[i]);
            }
            if (object.uvs) {
                if (!Array.isArray(object.uvs))
                    throw TypeError(".protocol.Geometry.uvs: array expected");
                message.uvs = [];
                for (var i = 0; i < object.uvs.length; ++i)
                    message.uvs[i] = Number(object.uvs[i]);
            }
            if (object.aos) {
                if (!Array.isArray(object.aos))
                    throw TypeError(".protocol.Geometry.aos: array expected");
                message.aos = [];
                for (var i = 0; i < object.aos.length; ++i)
                    message.aos[i] = Number(object.aos[i]);
            }
            return message;
        };

        /**
         * Creates a plain object from a Geometry message. Also converts values to other types if specified.
         * @function toObject
         * @memberof protocol.Geometry
         * @static
         * @param {protocol.Geometry} message Geometry
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Geometry.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults) {
                object.torchLights = [];
                object.sunlights = [];
                object.indices = [];
                object.positions = [];
                object.uvs = [];
                object.aos = [];
            }
            if (message.torchLights && message.torchLights.length) {
                object.torchLights = [];
                for (var j = 0; j < message.torchLights.length; ++j)
                    object.torchLights[j] = message.torchLights[j];
            }
            if (message.sunlights && message.sunlights.length) {
                object.sunlights = [];
                for (var j = 0; j < message.sunlights.length; ++j)
                    object.sunlights[j] = message.sunlights[j];
            }
            if (message.indices && message.indices.length) {
                object.indices = [];
                for (var j = 0; j < message.indices.length; ++j)
                    object.indices[j] = message.indices[j];
            }
            if (message.positions && message.positions.length) {
                object.positions = [];
                for (var j = 0; j < message.positions.length; ++j)
                    object.positions[j] = options.json && !isFinite(message.positions[j]) ? String(message.positions[j]) : message.positions[j];
            }
            if (message.uvs && message.uvs.length) {
                object.uvs = [];
                for (var j = 0; j < message.uvs.length; ++j)
                    object.uvs[j] = options.json && !isFinite(message.uvs[j]) ? String(message.uvs[j]) : message.uvs[j];
            }
            if (message.aos && message.aos.length) {
                object.aos = [];
                for (var j = 0; j < message.aos.length; ++j)
                    object.aos[j] = options.json && !isFinite(message.aos[j]) ? String(message.aos[j]) : message.aos[j];
            }
            return object;
        };

        /**
         * Converts this Geometry to JSON.
         * @function toJSON
         * @memberof protocol.Geometry
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Geometry.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Geometry;
    })();

    protocol.Mesh = (function() {

        /**
         * Properties of a Mesh.
         * @memberof protocol
         * @interface IMesh
         * @property {protocol.IGeometry|null} [opaque] Mesh opaque
         * @property {protocol.IGeometry|null} [transparent] Mesh transparent
         */

        /**
         * Constructs a new Mesh.
         * @memberof protocol
         * @classdesc Represents a Mesh.
         * @implements IMesh
         * @constructor
         * @param {protocol.IMesh=} [properties] Properties to set
         */
        function Mesh(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Mesh opaque.
         * @member {protocol.IGeometry|null|undefined} opaque
         * @memberof protocol.Mesh
         * @instance
         */
        Mesh.prototype.opaque = null;

        /**
         * Mesh transparent.
         * @member {protocol.IGeometry|null|undefined} transparent
         * @memberof protocol.Mesh
         * @instance
         */
        Mesh.prototype.transparent = null;

        /**
         * Creates a new Mesh instance using the specified properties.
         * @function create
         * @memberof protocol.Mesh
         * @static
         * @param {protocol.IMesh=} [properties] Properties to set
         * @returns {protocol.Mesh} Mesh instance
         */
        Mesh.create = function create(properties) {
            return new Mesh(properties);
        };

        /**
         * Encodes the specified Mesh message. Does not implicitly {@link protocol.Mesh.verify|verify} messages.
         * @function encode
         * @memberof protocol.Mesh
         * @static
         * @param {protocol.IMesh} message Mesh message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Mesh.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.opaque != null && Object.hasOwnProperty.call(message, "opaque"))
                $root.protocol.Geometry.encode(message.opaque, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.transparent != null && Object.hasOwnProperty.call(message, "transparent"))
                $root.protocol.Geometry.encode(message.transparent, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Mesh message, length delimited. Does not implicitly {@link protocol.Mesh.verify|verify} messages.
         * @function encodeDelimited
         * @memberof protocol.Mesh
         * @static
         * @param {protocol.IMesh} message Mesh message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Mesh.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Mesh message from the specified reader or buffer.
         * @function decode
         * @memberof protocol.Mesh
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {protocol.Mesh} Mesh
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Mesh.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.protocol.Mesh();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.opaque = $root.protocol.Geometry.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.transparent = $root.protocol.Geometry.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Mesh message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof protocol.Mesh
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {protocol.Mesh} Mesh
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Mesh.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Mesh message.
         * @function verify
         * @memberof protocol.Mesh
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Mesh.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.opaque != null && message.hasOwnProperty("opaque")) {
                var error = $root.protocol.Geometry.verify(message.opaque);
                if (error)
                    return "opaque." + error;
            }
            if (message.transparent != null && message.hasOwnProperty("transparent")) {
                var error = $root.protocol.Geometry.verify(message.transparent);
                if (error)
                    return "transparent." + error;
            }
            return null;
        };

        /**
         * Creates a Mesh message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof protocol.Mesh
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {protocol.Mesh} Mesh
         */
        Mesh.fromObject = function fromObject(object) {
            if (object instanceof $root.protocol.Mesh)
                return object;
            var message = new $root.protocol.Mesh();
            if (object.opaque != null) {
                if (typeof object.opaque !== "object")
                    throw TypeError(".protocol.Mesh.opaque: object expected");
                message.opaque = $root.protocol.Geometry.fromObject(object.opaque);
            }
            if (object.transparent != null) {
                if (typeof object.transparent !== "object")
                    throw TypeError(".protocol.Mesh.transparent: object expected");
                message.transparent = $root.protocol.Geometry.fromObject(object.transparent);
            }
            return message;
        };

        /**
         * Creates a plain object from a Mesh message. Also converts values to other types if specified.
         * @function toObject
         * @memberof protocol.Mesh
         * @static
         * @param {protocol.Mesh} message Mesh
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Mesh.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.opaque = null;
                object.transparent = null;
            }
            if (message.opaque != null && message.hasOwnProperty("opaque"))
                object.opaque = $root.protocol.Geometry.toObject(message.opaque, options);
            if (message.transparent != null && message.hasOwnProperty("transparent"))
                object.transparent = $root.protocol.Geometry.toObject(message.transparent, options);
            return object;
        };

        /**
         * Converts this Mesh to JSON.
         * @function toJSON
         * @memberof protocol.Mesh
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Mesh.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Mesh;
    })();

    protocol.Chunk = (function() {

        /**
         * Properties of a Chunk.
         * @memberof protocol
         * @interface IChunk
         * @property {number|null} [x] Chunk x
         * @property {number|null} [z] Chunk z
         * @property {Array.<protocol.IMesh>|null} [meshes] Chunk meshes
         * @property {Array.<number>|null} [voxels] Chunk voxels
         * @property {Array.<number>|null} [lights] Chunk lights
         */

        /**
         * Constructs a new Chunk.
         * @memberof protocol
         * @classdesc Represents a Chunk.
         * @implements IChunk
         * @constructor
         * @param {protocol.IChunk=} [properties] Properties to set
         */
        function Chunk(properties) {
            this.meshes = [];
            this.voxels = [];
            this.lights = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Chunk x.
         * @member {number} x
         * @memberof protocol.Chunk
         * @instance
         */
        Chunk.prototype.x = 0;

        /**
         * Chunk z.
         * @member {number} z
         * @memberof protocol.Chunk
         * @instance
         */
        Chunk.prototype.z = 0;

        /**
         * Chunk meshes.
         * @member {Array.<protocol.IMesh>} meshes
         * @memberof protocol.Chunk
         * @instance
         */
        Chunk.prototype.meshes = $util.emptyArray;

        /**
         * Chunk voxels.
         * @member {Array.<number>} voxels
         * @memberof protocol.Chunk
         * @instance
         */
        Chunk.prototype.voxels = $util.emptyArray;

        /**
         * Chunk lights.
         * @member {Array.<number>} lights
         * @memberof protocol.Chunk
         * @instance
         */
        Chunk.prototype.lights = $util.emptyArray;

        /**
         * Creates a new Chunk instance using the specified properties.
         * @function create
         * @memberof protocol.Chunk
         * @static
         * @param {protocol.IChunk=} [properties] Properties to set
         * @returns {protocol.Chunk} Chunk instance
         */
        Chunk.create = function create(properties) {
            return new Chunk(properties);
        };

        /**
         * Encodes the specified Chunk message. Does not implicitly {@link protocol.Chunk.verify|verify} messages.
         * @function encode
         * @memberof protocol.Chunk
         * @static
         * @param {protocol.IChunk} message Chunk message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Chunk.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.x != null && Object.hasOwnProperty.call(message, "x"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.x);
            if (message.z != null && Object.hasOwnProperty.call(message, "z"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.z);
            if (message.meshes != null && message.meshes.length)
                for (var i = 0; i < message.meshes.length; ++i)
                    $root.protocol.Mesh.encode(message.meshes[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
            if (message.voxels != null && message.voxels.length) {
                writer.uint32(/* id 4, wireType 2 =*/34).fork();
                for (var i = 0; i < message.voxels.length; ++i)
                    writer.uint32(message.voxels[i]);
                writer.ldelim();
            }
            if (message.lights != null && message.lights.length) {
                writer.uint32(/* id 5, wireType 2 =*/42).fork();
                for (var i = 0; i < message.lights.length; ++i)
                    writer.uint32(message.lights[i]);
                writer.ldelim();
            }
            return writer;
        };

        /**
         * Encodes the specified Chunk message, length delimited. Does not implicitly {@link protocol.Chunk.verify|verify} messages.
         * @function encodeDelimited
         * @memberof protocol.Chunk
         * @static
         * @param {protocol.IChunk} message Chunk message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Chunk.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Chunk message from the specified reader or buffer.
         * @function decode
         * @memberof protocol.Chunk
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {protocol.Chunk} Chunk
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Chunk.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.protocol.Chunk();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.x = reader.int32();
                    break;
                case 2:
                    message.z = reader.int32();
                    break;
                case 3:
                    if (!(message.meshes && message.meshes.length))
                        message.meshes = [];
                    message.meshes.push($root.protocol.Mesh.decode(reader, reader.uint32()));
                    break;
                case 4:
                    if (!(message.voxels && message.voxels.length))
                        message.voxels = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.voxels.push(reader.uint32());
                    } else
                        message.voxels.push(reader.uint32());
                    break;
                case 5:
                    if (!(message.lights && message.lights.length))
                        message.lights = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.lights.push(reader.uint32());
                    } else
                        message.lights.push(reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Chunk message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof protocol.Chunk
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {protocol.Chunk} Chunk
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Chunk.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Chunk message.
         * @function verify
         * @memberof protocol.Chunk
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Chunk.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.x != null && message.hasOwnProperty("x"))
                if (!$util.isInteger(message.x))
                    return "x: integer expected";
            if (message.z != null && message.hasOwnProperty("z"))
                if (!$util.isInteger(message.z))
                    return "z: integer expected";
            if (message.meshes != null && message.hasOwnProperty("meshes")) {
                if (!Array.isArray(message.meshes))
                    return "meshes: array expected";
                for (var i = 0; i < message.meshes.length; ++i) {
                    var error = $root.protocol.Mesh.verify(message.meshes[i]);
                    if (error)
                        return "meshes." + error;
                }
            }
            if (message.voxels != null && message.hasOwnProperty("voxels")) {
                if (!Array.isArray(message.voxels))
                    return "voxels: array expected";
                for (var i = 0; i < message.voxels.length; ++i)
                    if (!$util.isInteger(message.voxels[i]))
                        return "voxels: integer[] expected";
            }
            if (message.lights != null && message.hasOwnProperty("lights")) {
                if (!Array.isArray(message.lights))
                    return "lights: array expected";
                for (var i = 0; i < message.lights.length; ++i)
                    if (!$util.isInteger(message.lights[i]))
                        return "lights: integer[] expected";
            }
            return null;
        };

        /**
         * Creates a Chunk message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof protocol.Chunk
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {protocol.Chunk} Chunk
         */
        Chunk.fromObject = function fromObject(object) {
            if (object instanceof $root.protocol.Chunk)
                return object;
            var message = new $root.protocol.Chunk();
            if (object.x != null)
                message.x = object.x | 0;
            if (object.z != null)
                message.z = object.z | 0;
            if (object.meshes) {
                if (!Array.isArray(object.meshes))
                    throw TypeError(".protocol.Chunk.meshes: array expected");
                message.meshes = [];
                for (var i = 0; i < object.meshes.length; ++i) {
                    if (typeof object.meshes[i] !== "object")
                        throw TypeError(".protocol.Chunk.meshes: object expected");
                    message.meshes[i] = $root.protocol.Mesh.fromObject(object.meshes[i]);
                }
            }
            if (object.voxels) {
                if (!Array.isArray(object.voxels))
                    throw TypeError(".protocol.Chunk.voxels: array expected");
                message.voxels = [];
                for (var i = 0; i < object.voxels.length; ++i)
                    message.voxels[i] = object.voxels[i] >>> 0;
            }
            if (object.lights) {
                if (!Array.isArray(object.lights))
                    throw TypeError(".protocol.Chunk.lights: array expected");
                message.lights = [];
                for (var i = 0; i < object.lights.length; ++i)
                    message.lights[i] = object.lights[i] >>> 0;
            }
            return message;
        };

        /**
         * Creates a plain object from a Chunk message. Also converts values to other types if specified.
         * @function toObject
         * @memberof protocol.Chunk
         * @static
         * @param {protocol.Chunk} message Chunk
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Chunk.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults) {
                object.meshes = [];
                object.voxels = [];
                object.lights = [];
            }
            if (options.defaults) {
                object.x = 0;
                object.z = 0;
            }
            if (message.x != null && message.hasOwnProperty("x"))
                object.x = message.x;
            if (message.z != null && message.hasOwnProperty("z"))
                object.z = message.z;
            if (message.meshes && message.meshes.length) {
                object.meshes = [];
                for (var j = 0; j < message.meshes.length; ++j)
                    object.meshes[j] = $root.protocol.Mesh.toObject(message.meshes[j], options);
            }
            if (message.voxels && message.voxels.length) {
                object.voxels = [];
                for (var j = 0; j < message.voxels.length; ++j)
                    object.voxels[j] = message.voxels[j];
            }
            if (message.lights && message.lights.length) {
                object.lights = [];
                for (var j = 0; j < message.lights.length; ++j)
                    object.lights[j] = message.lights[j];
            }
            return object;
        };

        /**
         * Converts this Chunk to JSON.
         * @function toJSON
         * @memberof protocol.Chunk
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Chunk.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Chunk;
    })();

    protocol.Update = (function() {

        /**
         * Properties of an Update.
         * @memberof protocol
         * @interface IUpdate
         * @property {number|null} [vx] Update vx
         * @property {number|null} [vy] Update vy
         * @property {number|null} [vz] Update vz
         * @property {number|null} [type] Update type
         */

        /**
         * Constructs a new Update.
         * @memberof protocol
         * @classdesc Represents an Update.
         * @implements IUpdate
         * @constructor
         * @param {protocol.IUpdate=} [properties] Properties to set
         */
        function Update(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Update vx.
         * @member {number} vx
         * @memberof protocol.Update
         * @instance
         */
        Update.prototype.vx = 0;

        /**
         * Update vy.
         * @member {number} vy
         * @memberof protocol.Update
         * @instance
         */
        Update.prototype.vy = 0;

        /**
         * Update vz.
         * @member {number} vz
         * @memberof protocol.Update
         * @instance
         */
        Update.prototype.vz = 0;

        /**
         * Update type.
         * @member {number} type
         * @memberof protocol.Update
         * @instance
         */
        Update.prototype.type = 0;

        /**
         * Creates a new Update instance using the specified properties.
         * @function create
         * @memberof protocol.Update
         * @static
         * @param {protocol.IUpdate=} [properties] Properties to set
         * @returns {protocol.Update} Update instance
         */
        Update.create = function create(properties) {
            return new Update(properties);
        };

        /**
         * Encodes the specified Update message. Does not implicitly {@link protocol.Update.verify|verify} messages.
         * @function encode
         * @memberof protocol.Update
         * @static
         * @param {protocol.IUpdate} message Update message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Update.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.vx != null && Object.hasOwnProperty.call(message, "vx"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.vx);
            if (message.vy != null && Object.hasOwnProperty.call(message, "vy"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.vy);
            if (message.vz != null && Object.hasOwnProperty.call(message, "vz"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.vz);
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.type);
            return writer;
        };

        /**
         * Encodes the specified Update message, length delimited. Does not implicitly {@link protocol.Update.verify|verify} messages.
         * @function encodeDelimited
         * @memberof protocol.Update
         * @static
         * @param {protocol.IUpdate} message Update message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Update.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an Update message from the specified reader or buffer.
         * @function decode
         * @memberof protocol.Update
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {protocol.Update} Update
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Update.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.protocol.Update();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.vx = reader.int32();
                    break;
                case 2:
                    message.vy = reader.int32();
                    break;
                case 3:
                    message.vz = reader.int32();
                    break;
                case 4:
                    message.type = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an Update message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof protocol.Update
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {protocol.Update} Update
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Update.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Update message.
         * @function verify
         * @memberof protocol.Update
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Update.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.vx != null && message.hasOwnProperty("vx"))
                if (!$util.isInteger(message.vx))
                    return "vx: integer expected";
            if (message.vy != null && message.hasOwnProperty("vy"))
                if (!$util.isInteger(message.vy))
                    return "vy: integer expected";
            if (message.vz != null && message.hasOwnProperty("vz"))
                if (!$util.isInteger(message.vz))
                    return "vz: integer expected";
            if (message.type != null && message.hasOwnProperty("type"))
                if (!$util.isInteger(message.type))
                    return "type: integer expected";
            return null;
        };

        /**
         * Creates an Update message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof protocol.Update
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {protocol.Update} Update
         */
        Update.fromObject = function fromObject(object) {
            if (object instanceof $root.protocol.Update)
                return object;
            var message = new $root.protocol.Update();
            if (object.vx != null)
                message.vx = object.vx | 0;
            if (object.vy != null)
                message.vy = object.vy | 0;
            if (object.vz != null)
                message.vz = object.vz | 0;
            if (object.type != null)
                message.type = object.type | 0;
            return message;
        };

        /**
         * Creates a plain object from an Update message. Also converts values to other types if specified.
         * @function toObject
         * @memberof protocol.Update
         * @static
         * @param {protocol.Update} message Update
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Update.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.vx = 0;
                object.vy = 0;
                object.vz = 0;
                object.type = 0;
            }
            if (message.vx != null && message.hasOwnProperty("vx"))
                object.vx = message.vx;
            if (message.vy != null && message.hasOwnProperty("vy"))
                object.vy = message.vy;
            if (message.vz != null && message.hasOwnProperty("vz"))
                object.vz = message.vz;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = message.type;
            return object;
        };

        /**
         * Converts this Update to JSON.
         * @function toJSON
         * @memberof protocol.Update
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Update.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Update;
    })();

    protocol.Peer = (function() {

        /**
         * Properties of a Peer.
         * @memberof protocol
         * @interface IPeer
         * @property {string|null} [id] Peer id
         * @property {string|null} [name] Peer name
         * @property {number|null} [px] Peer px
         * @property {number|null} [py] Peer py
         * @property {number|null} [pz] Peer pz
         * @property {number|null} [qx] Peer qx
         * @property {number|null} [qy] Peer qy
         * @property {number|null} [qz] Peer qz
         * @property {number|null} [qw] Peer qw
         */

        /**
         * Constructs a new Peer.
         * @memberof protocol
         * @classdesc Represents a Peer.
         * @implements IPeer
         * @constructor
         * @param {protocol.IPeer=} [properties] Properties to set
         */
        function Peer(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Peer id.
         * @member {string} id
         * @memberof protocol.Peer
         * @instance
         */
        Peer.prototype.id = "";

        /**
         * Peer name.
         * @member {string} name
         * @memberof protocol.Peer
         * @instance
         */
        Peer.prototype.name = "";

        /**
         * Peer px.
         * @member {number} px
         * @memberof protocol.Peer
         * @instance
         */
        Peer.prototype.px = 0;

        /**
         * Peer py.
         * @member {number} py
         * @memberof protocol.Peer
         * @instance
         */
        Peer.prototype.py = 0;

        /**
         * Peer pz.
         * @member {number} pz
         * @memberof protocol.Peer
         * @instance
         */
        Peer.prototype.pz = 0;

        /**
         * Peer qx.
         * @member {number} qx
         * @memberof protocol.Peer
         * @instance
         */
        Peer.prototype.qx = 0;

        /**
         * Peer qy.
         * @member {number} qy
         * @memberof protocol.Peer
         * @instance
         */
        Peer.prototype.qy = 0;

        /**
         * Peer qz.
         * @member {number} qz
         * @memberof protocol.Peer
         * @instance
         */
        Peer.prototype.qz = 0;

        /**
         * Peer qw.
         * @member {number} qw
         * @memberof protocol.Peer
         * @instance
         */
        Peer.prototype.qw = 0;

        /**
         * Creates a new Peer instance using the specified properties.
         * @function create
         * @memberof protocol.Peer
         * @static
         * @param {protocol.IPeer=} [properties] Properties to set
         * @returns {protocol.Peer} Peer instance
         */
        Peer.create = function create(properties) {
            return new Peer(properties);
        };

        /**
         * Encodes the specified Peer message. Does not implicitly {@link protocol.Peer.verify|verify} messages.
         * @function encode
         * @memberof protocol.Peer
         * @static
         * @param {protocol.IPeer} message Peer message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Peer.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.id);
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
            if (message.px != null && Object.hasOwnProperty.call(message, "px"))
                writer.uint32(/* id 3, wireType 5 =*/29).float(message.px);
            if (message.py != null && Object.hasOwnProperty.call(message, "py"))
                writer.uint32(/* id 4, wireType 5 =*/37).float(message.py);
            if (message.pz != null && Object.hasOwnProperty.call(message, "pz"))
                writer.uint32(/* id 5, wireType 5 =*/45).float(message.pz);
            if (message.qx != null && Object.hasOwnProperty.call(message, "qx"))
                writer.uint32(/* id 6, wireType 5 =*/53).float(message.qx);
            if (message.qy != null && Object.hasOwnProperty.call(message, "qy"))
                writer.uint32(/* id 7, wireType 5 =*/61).float(message.qy);
            if (message.qz != null && Object.hasOwnProperty.call(message, "qz"))
                writer.uint32(/* id 8, wireType 5 =*/69).float(message.qz);
            if (message.qw != null && Object.hasOwnProperty.call(message, "qw"))
                writer.uint32(/* id 9, wireType 5 =*/77).float(message.qw);
            return writer;
        };

        /**
         * Encodes the specified Peer message, length delimited. Does not implicitly {@link protocol.Peer.verify|verify} messages.
         * @function encodeDelimited
         * @memberof protocol.Peer
         * @static
         * @param {protocol.IPeer} message Peer message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Peer.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Peer message from the specified reader or buffer.
         * @function decode
         * @memberof protocol.Peer
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {protocol.Peer} Peer
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Peer.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.protocol.Peer();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.string();
                    break;
                case 2:
                    message.name = reader.string();
                    break;
                case 3:
                    message.px = reader.float();
                    break;
                case 4:
                    message.py = reader.float();
                    break;
                case 5:
                    message.pz = reader.float();
                    break;
                case 6:
                    message.qx = reader.float();
                    break;
                case 7:
                    message.qy = reader.float();
                    break;
                case 8:
                    message.qz = reader.float();
                    break;
                case 9:
                    message.qw = reader.float();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Peer message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof protocol.Peer
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {protocol.Peer} Peer
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Peer.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Peer message.
         * @function verify
         * @memberof protocol.Peer
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Peer.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isString(message.id))
                    return "id: string expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.px != null && message.hasOwnProperty("px"))
                if (typeof message.px !== "number")
                    return "px: number expected";
            if (message.py != null && message.hasOwnProperty("py"))
                if (typeof message.py !== "number")
                    return "py: number expected";
            if (message.pz != null && message.hasOwnProperty("pz"))
                if (typeof message.pz !== "number")
                    return "pz: number expected";
            if (message.qx != null && message.hasOwnProperty("qx"))
                if (typeof message.qx !== "number")
                    return "qx: number expected";
            if (message.qy != null && message.hasOwnProperty("qy"))
                if (typeof message.qy !== "number")
                    return "qy: number expected";
            if (message.qz != null && message.hasOwnProperty("qz"))
                if (typeof message.qz !== "number")
                    return "qz: number expected";
            if (message.qw != null && message.hasOwnProperty("qw"))
                if (typeof message.qw !== "number")
                    return "qw: number expected";
            return null;
        };

        /**
         * Creates a Peer message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof protocol.Peer
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {protocol.Peer} Peer
         */
        Peer.fromObject = function fromObject(object) {
            if (object instanceof $root.protocol.Peer)
                return object;
            var message = new $root.protocol.Peer();
            if (object.id != null)
                message.id = String(object.id);
            if (object.name != null)
                message.name = String(object.name);
            if (object.px != null)
                message.px = Number(object.px);
            if (object.py != null)
                message.py = Number(object.py);
            if (object.pz != null)
                message.pz = Number(object.pz);
            if (object.qx != null)
                message.qx = Number(object.qx);
            if (object.qy != null)
                message.qy = Number(object.qy);
            if (object.qz != null)
                message.qz = Number(object.qz);
            if (object.qw != null)
                message.qw = Number(object.qw);
            return message;
        };

        /**
         * Creates a plain object from a Peer message. Also converts values to other types if specified.
         * @function toObject
         * @memberof protocol.Peer
         * @static
         * @param {protocol.Peer} message Peer
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Peer.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = "";
                object.name = "";
                object.px = 0;
                object.py = 0;
                object.pz = 0;
                object.qx = 0;
                object.qy = 0;
                object.qz = 0;
                object.qw = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.px != null && message.hasOwnProperty("px"))
                object.px = options.json && !isFinite(message.px) ? String(message.px) : message.px;
            if (message.py != null && message.hasOwnProperty("py"))
                object.py = options.json && !isFinite(message.py) ? String(message.py) : message.py;
            if (message.pz != null && message.hasOwnProperty("pz"))
                object.pz = options.json && !isFinite(message.pz) ? String(message.pz) : message.pz;
            if (message.qx != null && message.hasOwnProperty("qx"))
                object.qx = options.json && !isFinite(message.qx) ? String(message.qx) : message.qx;
            if (message.qy != null && message.hasOwnProperty("qy"))
                object.qy = options.json && !isFinite(message.qy) ? String(message.qy) : message.qy;
            if (message.qz != null && message.hasOwnProperty("qz"))
                object.qz = options.json && !isFinite(message.qz) ? String(message.qz) : message.qz;
            if (message.qw != null && message.hasOwnProperty("qw"))
                object.qw = options.json && !isFinite(message.qw) ? String(message.qw) : message.qw;
            return object;
        };

        /**
         * Converts this Peer to JSON.
         * @function toJSON
         * @memberof protocol.Peer
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Peer.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Peer;
    })();

    protocol.ChatMessage = (function() {

        /**
         * Properties of a ChatMessage.
         * @memberof protocol
         * @interface IChatMessage
         * @property {protocol.ChatMessage.Type|null} [type] ChatMessage type
         * @property {string|null} [sender] ChatMessage sender
         * @property {string|null} [body] ChatMessage body
         */

        /**
         * Constructs a new ChatMessage.
         * @memberof protocol
         * @classdesc Represents a ChatMessage.
         * @implements IChatMessage
         * @constructor
         * @param {protocol.IChatMessage=} [properties] Properties to set
         */
        function ChatMessage(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ChatMessage type.
         * @member {protocol.ChatMessage.Type} type
         * @memberof protocol.ChatMessage
         * @instance
         */
        ChatMessage.prototype.type = 0;

        /**
         * ChatMessage sender.
         * @member {string} sender
         * @memberof protocol.ChatMessage
         * @instance
         */
        ChatMessage.prototype.sender = "";

        /**
         * ChatMessage body.
         * @member {string} body
         * @memberof protocol.ChatMessage
         * @instance
         */
        ChatMessage.prototype.body = "";

        /**
         * Creates a new ChatMessage instance using the specified properties.
         * @function create
         * @memberof protocol.ChatMessage
         * @static
         * @param {protocol.IChatMessage=} [properties] Properties to set
         * @returns {protocol.ChatMessage} ChatMessage instance
         */
        ChatMessage.create = function create(properties) {
            return new ChatMessage(properties);
        };

        /**
         * Encodes the specified ChatMessage message. Does not implicitly {@link protocol.ChatMessage.verify|verify} messages.
         * @function encode
         * @memberof protocol.ChatMessage
         * @static
         * @param {protocol.IChatMessage} message ChatMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChatMessage.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.type);
            if (message.sender != null && Object.hasOwnProperty.call(message, "sender"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.sender);
            if (message.body != null && Object.hasOwnProperty.call(message, "body"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.body);
            return writer;
        };

        /**
         * Encodes the specified ChatMessage message, length delimited. Does not implicitly {@link protocol.ChatMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof protocol.ChatMessage
         * @static
         * @param {protocol.IChatMessage} message ChatMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChatMessage.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ChatMessage message from the specified reader or buffer.
         * @function decode
         * @memberof protocol.ChatMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {protocol.ChatMessage} ChatMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChatMessage.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.protocol.ChatMessage();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.type = reader.int32();
                    break;
                case 2:
                    message.sender = reader.string();
                    break;
                case 3:
                    message.body = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ChatMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof protocol.ChatMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {protocol.ChatMessage} ChatMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChatMessage.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ChatMessage message.
         * @function verify
         * @memberof protocol.ChatMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ChatMessage.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.type != null && message.hasOwnProperty("type"))
                switch (message.type) {
                default:
                    return "type: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                    break;
                }
            if (message.sender != null && message.hasOwnProperty("sender"))
                if (!$util.isString(message.sender))
                    return "sender: string expected";
            if (message.body != null && message.hasOwnProperty("body"))
                if (!$util.isString(message.body))
                    return "body: string expected";
            return null;
        };

        /**
         * Creates a ChatMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof protocol.ChatMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {protocol.ChatMessage} ChatMessage
         */
        ChatMessage.fromObject = function fromObject(object) {
            if (object instanceof $root.protocol.ChatMessage)
                return object;
            var message = new $root.protocol.ChatMessage();
            switch (object.type) {
            case "ERROR":
            case 0:
                message.type = 0;
                break;
            case "SERVER":
            case 1:
                message.type = 1;
                break;
            case "PLAYER":
            case 2:
                message.type = 2;
                break;
            case "INFO":
            case 3:
                message.type = 3;
                break;
            }
            if (object.sender != null)
                message.sender = String(object.sender);
            if (object.body != null)
                message.body = String(object.body);
            return message;
        };

        /**
         * Creates a plain object from a ChatMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof protocol.ChatMessage
         * @static
         * @param {protocol.ChatMessage} message ChatMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ChatMessage.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.type = options.enums === String ? "ERROR" : 0;
                object.sender = "";
                object.body = "";
            }
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = options.enums === String ? $root.protocol.ChatMessage.Type[message.type] : message.type;
            if (message.sender != null && message.hasOwnProperty("sender"))
                object.sender = message.sender;
            if (message.body != null && message.hasOwnProperty("body"))
                object.body = message.body;
            return object;
        };

        /**
         * Converts this ChatMessage to JSON.
         * @function toJSON
         * @memberof protocol.ChatMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ChatMessage.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Type enum.
         * @name protocol.ChatMessage.Type
         * @enum {number}
         * @property {number} ERROR=0 ERROR value
         * @property {number} SERVER=1 SERVER value
         * @property {number} PLAYER=2 PLAYER value
         * @property {number} INFO=3 INFO value
         */
        ChatMessage.Type = (function() {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "ERROR"] = 0;
            values[valuesById[1] = "SERVER"] = 1;
            values[valuesById[2] = "PLAYER"] = 2;
            values[valuesById[3] = "INFO"] = 3;
            return values;
        })();

        return ChatMessage;
    })();

    protocol.Message = (function() {

        /**
         * Properties of a Message.
         * @memberof protocol
         * @interface IMessage
         * @property {protocol.Message.Type|null} [type] Message type
         * @property {string|null} [json] Message json
         * @property {string|null} [text] Message text
         * @property {protocol.IChatMessage|null} [message] Message message
         * @property {Array.<protocol.IPeer>|null} [peers] Message peers
         * @property {Array.<protocol.IChunk>|null} [chunks] Message chunks
         * @property {Array.<protocol.IUpdate>|null} [updates] Message updates
         */

        /**
         * Constructs a new Message.
         * @memberof protocol
         * @classdesc Represents a Message.
         * @implements IMessage
         * @constructor
         * @param {protocol.IMessage=} [properties] Properties to set
         */
        function Message(properties) {
            this.peers = [];
            this.chunks = [];
            this.updates = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Message type.
         * @member {protocol.Message.Type} type
         * @memberof protocol.Message
         * @instance
         */
        Message.prototype.type = 0;

        /**
         * Message json.
         * @member {string} json
         * @memberof protocol.Message
         * @instance
         */
        Message.prototype.json = "";

        /**
         * Message text.
         * @member {string} text
         * @memberof protocol.Message
         * @instance
         */
        Message.prototype.text = "";

        /**
         * Message message.
         * @member {protocol.IChatMessage|null|undefined} message
         * @memberof protocol.Message
         * @instance
         */
        Message.prototype.message = null;

        /**
         * Message peers.
         * @member {Array.<protocol.IPeer>} peers
         * @memberof protocol.Message
         * @instance
         */
        Message.prototype.peers = $util.emptyArray;

        /**
         * Message chunks.
         * @member {Array.<protocol.IChunk>} chunks
         * @memberof protocol.Message
         * @instance
         */
        Message.prototype.chunks = $util.emptyArray;

        /**
         * Message updates.
         * @member {Array.<protocol.IUpdate>} updates
         * @memberof protocol.Message
         * @instance
         */
        Message.prototype.updates = $util.emptyArray;

        /**
         * Creates a new Message instance using the specified properties.
         * @function create
         * @memberof protocol.Message
         * @static
         * @param {protocol.IMessage=} [properties] Properties to set
         * @returns {protocol.Message} Message instance
         */
        Message.create = function create(properties) {
            return new Message(properties);
        };

        /**
         * Encodes the specified Message message. Does not implicitly {@link protocol.Message.verify|verify} messages.
         * @function encode
         * @memberof protocol.Message
         * @static
         * @param {protocol.IMessage} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.type);
            if (message.json != null && Object.hasOwnProperty.call(message, "json"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.json);
            if (message.text != null && Object.hasOwnProperty.call(message, "text"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.text);
            if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                $root.protocol.ChatMessage.encode(message.message, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
            if (message.peers != null && message.peers.length)
                for (var i = 0; i < message.peers.length; ++i)
                    $root.protocol.Peer.encode(message.peers[i], writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            if (message.chunks != null && message.chunks.length)
                for (var i = 0; i < message.chunks.length; ++i)
                    $root.protocol.Chunk.encode(message.chunks[i], writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.updates != null && message.updates.length)
                for (var i = 0; i < message.updates.length; ++i)
                    $root.protocol.Update.encode(message.updates[i], writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Message message, length delimited. Does not implicitly {@link protocol.Message.verify|verify} messages.
         * @function encodeDelimited
         * @memberof protocol.Message
         * @static
         * @param {protocol.IMessage} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @function decode
         * @memberof protocol.Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {protocol.Message} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.protocol.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.type = reader.int32();
                    break;
                case 2:
                    message.json = reader.string();
                    break;
                case 3:
                    message.text = reader.string();
                    break;
                case 4:
                    message.message = $root.protocol.ChatMessage.decode(reader, reader.uint32());
                    break;
                case 5:
                    if (!(message.peers && message.peers.length))
                        message.peers = [];
                    message.peers.push($root.protocol.Peer.decode(reader, reader.uint32()));
                    break;
                case 6:
                    if (!(message.chunks && message.chunks.length))
                        message.chunks = [];
                    message.chunks.push($root.protocol.Chunk.decode(reader, reader.uint32()));
                    break;
                case 7:
                    if (!(message.updates && message.updates.length))
                        message.updates = [];
                    message.updates.push($root.protocol.Update.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Message message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof protocol.Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {protocol.Message} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Message message.
         * @function verify
         * @memberof protocol.Message
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Message.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.type != null && message.hasOwnProperty("type"))
                switch (message.type) {
                default:
                    return "type: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                case 10:
                case 11:
                case 12:
                    break;
                }
            if (message.json != null && message.hasOwnProperty("json"))
                if (!$util.isString(message.json))
                    return "json: string expected";
            if (message.text != null && message.hasOwnProperty("text"))
                if (!$util.isString(message.text))
                    return "text: string expected";
            if (message.message != null && message.hasOwnProperty("message")) {
                var error = $root.protocol.ChatMessage.verify(message.message);
                if (error)
                    return "message." + error;
            }
            if (message.peers != null && message.hasOwnProperty("peers")) {
                if (!Array.isArray(message.peers))
                    return "peers: array expected";
                for (var i = 0; i < message.peers.length; ++i) {
                    var error = $root.protocol.Peer.verify(message.peers[i]);
                    if (error)
                        return "peers." + error;
                }
            }
            if (message.chunks != null && message.hasOwnProperty("chunks")) {
                if (!Array.isArray(message.chunks))
                    return "chunks: array expected";
                for (var i = 0; i < message.chunks.length; ++i) {
                    var error = $root.protocol.Chunk.verify(message.chunks[i]);
                    if (error)
                        return "chunks." + error;
                }
            }
            if (message.updates != null && message.hasOwnProperty("updates")) {
                if (!Array.isArray(message.updates))
                    return "updates: array expected";
                for (var i = 0; i < message.updates.length; ++i) {
                    var error = $root.protocol.Update.verify(message.updates[i]);
                    if (error)
                        return "updates." + error;
                }
            }
            return null;
        };

        /**
         * Creates a Message message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof protocol.Message
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {protocol.Message} Message
         */
        Message.fromObject = function fromObject(object) {
            if (object instanceof $root.protocol.Message)
                return object;
            var message = new $root.protocol.Message();
            switch (object.type) {
            case "ERROR":
            case 0:
                message.type = 0;
                break;
            case "INIT":
            case 1:
                message.type = 1;
                break;
            case "JOIN":
            case 2:
                message.type = 2;
                break;
            case "LEAVE":
            case 3:
                message.type = 3;
                break;
            case "LOAD":
            case 4:
                message.type = 4;
                break;
            case "PICK":
            case 5:
                message.type = 5;
                break;
            case "TELEPORT":
            case 6:
                message.type = 6;
                break;
            case "UPDATE":
            case 7:
                message.type = 7;
                break;
            case "REQUEST":
            case 8:
                message.type = 8;
                break;
            case "CONFIG":
            case 9:
                message.type = 9;
                break;
            case "PEER":
            case 10:
                message.type = 10;
                break;
            case "ENTITY":
            case 11:
                message.type = 11;
                break;
            case "MESSAGE":
            case 12:
                message.type = 12;
                break;
            }
            if (object.json != null)
                message.json = String(object.json);
            if (object.text != null)
                message.text = String(object.text);
            if (object.message != null) {
                if (typeof object.message !== "object")
                    throw TypeError(".protocol.Message.message: object expected");
                message.message = $root.protocol.ChatMessage.fromObject(object.message);
            }
            if (object.peers) {
                if (!Array.isArray(object.peers))
                    throw TypeError(".protocol.Message.peers: array expected");
                message.peers = [];
                for (var i = 0; i < object.peers.length; ++i) {
                    if (typeof object.peers[i] !== "object")
                        throw TypeError(".protocol.Message.peers: object expected");
                    message.peers[i] = $root.protocol.Peer.fromObject(object.peers[i]);
                }
            }
            if (object.chunks) {
                if (!Array.isArray(object.chunks))
                    throw TypeError(".protocol.Message.chunks: array expected");
                message.chunks = [];
                for (var i = 0; i < object.chunks.length; ++i) {
                    if (typeof object.chunks[i] !== "object")
                        throw TypeError(".protocol.Message.chunks: object expected");
                    message.chunks[i] = $root.protocol.Chunk.fromObject(object.chunks[i]);
                }
            }
            if (object.updates) {
                if (!Array.isArray(object.updates))
                    throw TypeError(".protocol.Message.updates: array expected");
                message.updates = [];
                for (var i = 0; i < object.updates.length; ++i) {
                    if (typeof object.updates[i] !== "object")
                        throw TypeError(".protocol.Message.updates: object expected");
                    message.updates[i] = $root.protocol.Update.fromObject(object.updates[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a Message message. Also converts values to other types if specified.
         * @function toObject
         * @memberof protocol.Message
         * @static
         * @param {protocol.Message} message Message
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Message.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults) {
                object.peers = [];
                object.chunks = [];
                object.updates = [];
            }
            if (options.defaults) {
                object.type = options.enums === String ? "ERROR" : 0;
                object.json = "";
                object.text = "";
                object.message = null;
            }
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = options.enums === String ? $root.protocol.Message.Type[message.type] : message.type;
            if (message.json != null && message.hasOwnProperty("json"))
                object.json = message.json;
            if (message.text != null && message.hasOwnProperty("text"))
                object.text = message.text;
            if (message.message != null && message.hasOwnProperty("message"))
                object.message = $root.protocol.ChatMessage.toObject(message.message, options);
            if (message.peers && message.peers.length) {
                object.peers = [];
                for (var j = 0; j < message.peers.length; ++j)
                    object.peers[j] = $root.protocol.Peer.toObject(message.peers[j], options);
            }
            if (message.chunks && message.chunks.length) {
                object.chunks = [];
                for (var j = 0; j < message.chunks.length; ++j)
                    object.chunks[j] = $root.protocol.Chunk.toObject(message.chunks[j], options);
            }
            if (message.updates && message.updates.length) {
                object.updates = [];
                for (var j = 0; j < message.updates.length; ++j)
                    object.updates[j] = $root.protocol.Update.toObject(message.updates[j], options);
            }
            return object;
        };

        /**
         * Converts this Message to JSON.
         * @function toJSON
         * @memberof protocol.Message
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Message.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Type enum.
         * @name protocol.Message.Type
         * @enum {number}
         * @property {number} ERROR=0 ERROR value
         * @property {number} INIT=1 INIT value
         * @property {number} JOIN=2 JOIN value
         * @property {number} LEAVE=3 LEAVE value
         * @property {number} LOAD=4 LOAD value
         * @property {number} PICK=5 PICK value
         * @property {number} TELEPORT=6 TELEPORT value
         * @property {number} UPDATE=7 UPDATE value
         * @property {number} REQUEST=8 REQUEST value
         * @property {number} CONFIG=9 CONFIG value
         * @property {number} PEER=10 PEER value
         * @property {number} ENTITY=11 ENTITY value
         * @property {number} MESSAGE=12 MESSAGE value
         */
        Message.Type = (function() {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "ERROR"] = 0;
            values[valuesById[1] = "INIT"] = 1;
            values[valuesById[2] = "JOIN"] = 2;
            values[valuesById[3] = "LEAVE"] = 3;
            values[valuesById[4] = "LOAD"] = 4;
            values[valuesById[5] = "PICK"] = 5;
            values[valuesById[6] = "TELEPORT"] = 6;
            values[valuesById[7] = "UPDATE"] = 7;
            values[valuesById[8] = "REQUEST"] = 8;
            values[valuesById[9] = "CONFIG"] = 9;
            values[valuesById[10] = "PEER"] = 10;
            values[valuesById[11] = "ENTITY"] = 11;
            values[valuesById[12] = "MESSAGE"] = 12;
            return values;
        })();

        return Message;
    })();

    return protocol;
})();

module.exports = $root;
