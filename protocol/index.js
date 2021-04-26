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
         * @property {Array.<number>|null} [normals] Geometry normals
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
            this.normals = [];
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
         * Geometry normals.
         * @member {Array.<number>} normals
         * @memberof protocol.Geometry
         * @instance
         */
        Geometry.prototype.normals = $util.emptyArray;

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
            if (message.normals != null && message.normals.length) {
                writer.uint32(/* id 5, wireType 2 =*/42).fork();
                for (var i = 0; i < message.normals.length; ++i)
                    writer.int32(message.normals[i]);
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
                case 5:
                    if (!(message.normals && message.normals.length))
                        message.normals = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.normals.push(reader.int32());
                    } else
                        message.normals.push(reader.int32());
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
            if (message.normals != null && message.hasOwnProperty("normals")) {
                if (!Array.isArray(message.normals))
                    return "normals: array expected";
                for (var i = 0; i < message.normals.length; ++i)
                    if (!$util.isInteger(message.normals[i]))
                        return "normals: integer[] expected";
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
            if (object.normals) {
                if (!Array.isArray(object.normals))
                    throw TypeError(".protocol.Geometry.normals: array expected");
                message.normals = [];
                for (var i = 0; i < object.normals.length; ++i)
                    message.normals[i] = object.normals[i] | 0;
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
                object.normals = [];
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
            if (message.normals && message.normals.length) {
                object.normals = [];
                for (var j = 0; j < message.normals.length; ++j)
                    object.normals[j] = message.normals[j];
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
                    writer.int32(message.voxels[i]);
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
                            message.voxels.push(reader.int32());
                    } else
                        message.voxels.push(reader.int32());
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
                    message.voxels[i] = object.voxels[i] | 0;
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

    protocol.Message = (function() {

        /**
         * Properties of a Message.
         * @memberof protocol
         * @interface IMessage
         * @property {protocol.Message.Type|null} [type] Message type
         * @property {string|null} [json] Message json
         * @property {string|null} [text] Message text
         * @property {Array.<protocol.IChunk>|null} [chunks] Message chunks
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
            this.chunks = [];
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
        Message.prototype.type = 1;

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
         * Message chunks.
         * @member {Array.<protocol.IChunk>} chunks
         * @memberof protocol.Message
         * @instance
         */
        Message.prototype.chunks = $util.emptyArray;

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
            if (message.chunks != null && message.chunks.length)
                for (var i = 0; i < message.chunks.length; ++i)
                    $root.protocol.Chunk.encode(message.chunks[i], writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
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
                    if (!(message.chunks && message.chunks.length))
                        message.chunks = [];
                    message.chunks.push($root.protocol.Chunk.decode(reader, reader.uint32()));
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
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                    break;
                }
            if (message.json != null && message.hasOwnProperty("json"))
                if (!$util.isString(message.json))
                    return "json: string expected";
            if (message.text != null && message.hasOwnProperty("text"))
                if (!$util.isString(message.text))
                    return "text: string expected";
            if (message.chunks != null && message.hasOwnProperty("chunks")) {
                if (!Array.isArray(message.chunks))
                    return "chunks: array expected";
                for (var i = 0; i < message.chunks.length; ++i) {
                    var error = $root.protocol.Chunk.verify(message.chunks[i]);
                    if (error)
                        return "chunks." + error;
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
            case 1:
                message.type = 1;
                break;
            case "INIT":
            case 2:
                message.type = 2;
                break;
            case "JOIN":
            case 3:
                message.type = 3;
                break;
            case "LEAVE":
            case 4:
                message.type = 4;
                break;
            case "LOAD":
            case 5:
                message.type = 5;
                break;
            case "PICK":
            case 6:
                message.type = 6;
                break;
            case "TELEPORT":
            case 7:
                message.type = 7;
                break;
            case "UPDATE":
            case 8:
                message.type = 8;
                break;
            case "REQUEST":
            case 9:
                message.type = 9;
                break;
            }
            if (object.json != null)
                message.json = String(object.json);
            if (object.text != null)
                message.text = String(object.text);
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
            if (options.arrays || options.defaults)
                object.chunks = [];
            if (options.defaults) {
                object.type = options.enums === String ? "ERROR" : 1;
                object.json = "";
                object.text = "";
            }
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = options.enums === String ? $root.protocol.Message.Type[message.type] : message.type;
            if (message.json != null && message.hasOwnProperty("json"))
                object.json = message.json;
            if (message.text != null && message.hasOwnProperty("text"))
                object.text = message.text;
            if (message.chunks && message.chunks.length) {
                object.chunks = [];
                for (var j = 0; j < message.chunks.length; ++j)
                    object.chunks[j] = $root.protocol.Chunk.toObject(message.chunks[j], options);
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
         * @property {number} ERROR=1 ERROR value
         * @property {number} INIT=2 INIT value
         * @property {number} JOIN=3 JOIN value
         * @property {number} LEAVE=4 LEAVE value
         * @property {number} LOAD=5 LOAD value
         * @property {number} PICK=6 PICK value
         * @property {number} TELEPORT=7 TELEPORT value
         * @property {number} UPDATE=8 UPDATE value
         * @property {number} REQUEST=9 REQUEST value
         */
        Message.Type = (function() {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[1] = "ERROR"] = 1;
            values[valuesById[2] = "INIT"] = 2;
            values[valuesById[3] = "JOIN"] = 3;
            values[valuesById[4] = "LEAVE"] = 4;
            values[valuesById[5] = "LOAD"] = 5;
            values[valuesById[6] = "PICK"] = 6;
            values[valuesById[7] = "TELEPORT"] = 7;
            values[valuesById[8] = "UPDATE"] = 8;
            values[valuesById[9] = "REQUEST"] = 9;
            return values;
        })();

        return Message;
    })();

    return protocol;
})();

module.exports = $root;
