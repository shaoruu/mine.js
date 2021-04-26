import * as $protobuf from "protobufjs";
/** Namespace protocol. */
export namespace protocol {

    /** Properties of a Geometry. */
    interface IGeometry {

        /** Geometry torchLights */
        torchLights?: (number[]|null);

        /** Geometry sunlights */
        sunlights?: (number[]|null);

        /** Geometry indices */
        indices?: (number[]|null);

        /** Geometry positions */
        positions?: (number[]|null);

        /** Geometry normals */
        normals?: (number[]|null);

        /** Geometry uvs */
        uvs?: (number[]|null);

        /** Geometry aos */
        aos?: (number[]|null);
    }

    /** Represents a Geometry. */
    class Geometry implements IGeometry {

        /**
         * Constructs a new Geometry.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IGeometry);

        /** Geometry torchLights. */
        public torchLights: number[];

        /** Geometry sunlights. */
        public sunlights: number[];

        /** Geometry indices. */
        public indices: number[];

        /** Geometry positions. */
        public positions: number[];

        /** Geometry normals. */
        public normals: number[];

        /** Geometry uvs. */
        public uvs: number[];

        /** Geometry aos. */
        public aos: number[];

        /**
         * Creates a new Geometry instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Geometry instance
         */
        public static create(properties?: protocol.IGeometry): protocol.Geometry;

        /**
         * Encodes the specified Geometry message. Does not implicitly {@link protocol.Geometry.verify|verify} messages.
         * @param message Geometry message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IGeometry, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Geometry message, length delimited. Does not implicitly {@link protocol.Geometry.verify|verify} messages.
         * @param message Geometry message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IGeometry, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Geometry message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Geometry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Geometry;

        /**
         * Decodes a Geometry message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Geometry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Geometry;

        /**
         * Verifies a Geometry message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Geometry message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Geometry
         */
        public static fromObject(object: { [k: string]: any }): protocol.Geometry;

        /**
         * Creates a plain object from a Geometry message. Also converts values to other types if specified.
         * @param message Geometry
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Geometry, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Geometry to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Mesh. */
    interface IMesh {

        /** Mesh opaque */
        opaque?: (protocol.IGeometry|null);

        /** Mesh transparent */
        transparent?: (protocol.IGeometry|null);
    }

    /** Represents a Mesh. */
    class Mesh implements IMesh {

        /**
         * Constructs a new Mesh.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IMesh);

        /** Mesh opaque. */
        public opaque?: (protocol.IGeometry|null);

        /** Mesh transparent. */
        public transparent?: (protocol.IGeometry|null);

        /**
         * Creates a new Mesh instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Mesh instance
         */
        public static create(properties?: protocol.IMesh): protocol.Mesh;

        /**
         * Encodes the specified Mesh message. Does not implicitly {@link protocol.Mesh.verify|verify} messages.
         * @param message Mesh message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IMesh, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Mesh message, length delimited. Does not implicitly {@link protocol.Mesh.verify|verify} messages.
         * @param message Mesh message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IMesh, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Mesh message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Mesh
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Mesh;

        /**
         * Decodes a Mesh message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Mesh
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Mesh;

        /**
         * Verifies a Mesh message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Mesh message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Mesh
         */
        public static fromObject(object: { [k: string]: any }): protocol.Mesh;

        /**
         * Creates a plain object from a Mesh message. Also converts values to other types if specified.
         * @param message Mesh
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Mesh, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Mesh to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Chunk. */
    interface IChunk {

        /** Chunk x */
        x?: (number|null);

        /** Chunk z */
        z?: (number|null);

        /** Chunk meshes */
        meshes?: (protocol.IMesh[]|null);

        /** Chunk voxels */
        voxels?: (number[]|null);
    }

    /** Represents a Chunk. */
    class Chunk implements IChunk {

        /**
         * Constructs a new Chunk.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IChunk);

        /** Chunk x. */
        public x: number;

        /** Chunk z. */
        public z: number;

        /** Chunk meshes. */
        public meshes: protocol.IMesh[];

        /** Chunk voxels. */
        public voxels: number[];

        /**
         * Creates a new Chunk instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Chunk instance
         */
        public static create(properties?: protocol.IChunk): protocol.Chunk;

        /**
         * Encodes the specified Chunk message. Does not implicitly {@link protocol.Chunk.verify|verify} messages.
         * @param message Chunk message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IChunk, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Chunk message, length delimited. Does not implicitly {@link protocol.Chunk.verify|verify} messages.
         * @param message Chunk message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IChunk, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Chunk message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Chunk
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Chunk;

        /**
         * Decodes a Chunk message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Chunk
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Chunk;

        /**
         * Verifies a Chunk message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Chunk message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Chunk
         */
        public static fromObject(object: { [k: string]: any }): protocol.Chunk;

        /**
         * Creates a plain object from a Chunk message. Also converts values to other types if specified.
         * @param message Chunk
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Chunk, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Chunk to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Message. */
    interface IMessage {

        /** Message type */
        type?: (protocol.Message.Type|null);

        /** Message json */
        json?: (string|null);

        /** Message text */
        text?: (string|null);

        /** Message chunks */
        chunks?: (protocol.IChunk[]|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: protocol.IMessage);

        /** Message type. */
        public type: protocol.Message.Type;

        /** Message json. */
        public json: string;

        /** Message text. */
        public text: string;

        /** Message chunks. */
        public chunks: protocol.IChunk[];

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        public static create(properties?: protocol.IMessage): protocol.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link protocol.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: protocol.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Message message, length delimited. Does not implicitly {@link protocol.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: protocol.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): protocol.Message;

        /**
         * Decodes a Message message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): protocol.Message;

        /**
         * Verifies a Message message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Message message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Message
         */
        public static fromObject(object: { [k: string]: any }): protocol.Message;

        /**
         * Creates a plain object from a Message message. Also converts values to other types if specified.
         * @param message Message
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: protocol.Message, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Message to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    namespace Message {

        /** Type enum. */
        enum Type {
            ERROR = 1,
            INIT = 2,
            JOIN = 3,
            LEAVE = 4,
            LOAD = 5,
            PICK = 6,
            TELEPORT = 7,
            UPDATE = 8,
            REQUEST = 9
        }
    }
}
