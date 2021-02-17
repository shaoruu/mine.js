import Engine, { Material, Mesh } from '..';
import { Color3, Color4 } from './types';
export interface IRegistryOptions {
    /**
     * @default ''
     */
    texturePath: string;
}
interface IMeshData {
    color: Color3;
    alpha: number;
    texture: string;
    textureAlpha: boolean;
    renderMat: Material | null;
}
export interface IBlockProps {
    fluidDensity?: number;
    viscosity?: number;
}
export declare type blockHandler = (arg0: any, arg1: any, arg2: any, arg3: any) => void;
interface IBlockOptions {
    solid: boolean;
    opaque: boolean;
    fluid: boolean;
    fluidDensity: number;
    viscosity: number;
    blockMesh: Mesh | null;
    material: any | null;
    onLoad: null | blockHandler;
    onUnload: null | blockHandler;
    onSet: null | blockHandler;
    onUnset: null | blockHandler;
    onCustomMeshCreate: null | blockHandler;
}
/**
 * @typicalname noa.registry
 * @classdesc for registering block types, materials & properties
 */
export declare class Registry {
    constructor(noa: Engine, options: Partial<IRegistryOptions>);
    noa: Engine;
    texturePath: string;
    _blockMats: number[];
    _blockProps: {
        [key: number]: IBlockProps;
    };
    _blockIsFluidLookup: boolean[];
    _solidityLookup: boolean[];
    _fluidityLookup: boolean[];
    _opacityLookup: boolean[];
    _objectLookup: boolean[];
    _blockMeshLookup: Mesh[];
    _blockHandlerLookup: (BlockCallbackHolder | null)[];
    matIDs: {
        [key: string]: number;
    };
    matData: {
        [key: number]: IMeshData;
    };
    /**
     * Register (by integer ID) a block type and its parameters.
     *
     *  `id` param: integer, currently 1..255. This needs to be passed in by the
     *    client because it goes into the chunk data, which someday will get serialized.
     *
     *  `options` param: Recognized fields for the options object:
     *
     *  * material: can be:
     *      * one (String) material name
     *      * array of 2 names: [top/bottom, sides]
     *      * array of 3 names: [top, bottom, sides]
     *      * array of 6 names: [-x, +x, -y, +y, -z, +z]
     *    If not specified, terrain won't be meshed for the block type
     *  * solid: (true) solidity for physics purposes
     *  * opaque: (true) fully obscures neighboring blocks
     *  * fluid: (false) whether nonsolid block is a fluid (buoyant, viscous..)
     *  * blockMesh: (null) if specified, noa will create a copy this mesh in the voxel
     *  * fluidDensity: (1.0) for fluid blocks
     *  * viscosity: (0.5) for fluid blocks
     *  * onLoad(): block event handler
     *  * onUnload(): block event handler
     *  * onSet(): block event handler
     *  * onUnset(): block event handler
     *  * onCustomMeshCreate(): block event handler
     */
    registerBlock: (id: number, options: Partial<IBlockOptions>) => number;
    /**
     * Register (by name) a material and its parameters.
     *
     * @param name
     * @param color RGB [number, number, number] or RGBA [number, number, number, number]
     * @param textureURL
     * @param texHasAlpha
     * @param renderMaterial an optional BABYLON material to be used for block faces with this block material
     */
    registerMaterial: (name: string, color?: Color3 | Color4, textureURL?: string | undefined, texHasAlpha?: boolean, renderMaterial?: Material | null) => number;
    /**
     * block solidity (as in physics)
     * @param id
     */
    getBlockSolidity: (id: number) => boolean;
    /**
     * block opacity - whether it obscures the whole voxel (dirt) or
     * can be partially seen through (like a fencepost, etc)
     * @param id
     */
    getBlockOpacity: (id: number) => boolean;
    /**
     * block is fluid or not
     * @param id
     */
    getBlockFluidity: (id: number) => boolean;
    /**
     * Get block property object passed in at registration
     * @param id
     */
    getBlockProps: (id: number) => IBlockProps;
    getBlockFaceMaterial: (blockId: number, dir: number) => number;
    /** look up material color given ID */
    getMaterialColor: (matID: number) => Color3;
    /** look up material texture given ID */
    getMaterialTexture: (matID: number) => string;
    /** look up material's properties: color, alpha, texture, textureAlpha */
    getMaterialData: (matID: number) => IMeshData;
    /**
     * look up color used for vertices of blocks of given material
     * - i.e. white if it has a texture, color otherwise
     */
    _getMaterialVertexColor: (matID: number) => Color3;
    getMaterialId: (name: string, lazyInit?: boolean) => number;
}
export declare class BlockCallbackHolder {
    constructor(options: IBlockOptions);
    onLoad: null | blockHandler;
    onUnload: null | blockHandler;
    onSet: null | blockHandler;
    onUnset: null | blockHandler;
    onCustomMeshCreate: null | blockHandler;
}
export {};
