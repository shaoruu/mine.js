import { Texture, CanvasTexture, ShaderMaterial } from 'three';
import { BlockMaterialType, BlockMaterialUVType, SmartDictionary } from '../libs';
import { Engine } from './engine';
declare type RegistryOptionsType = {
    textureWidth: number;
};
declare type MaterialOptionsType = {
    color?: string;
    texture?: Texture;
    image?: HTMLImageElement;
};
declare type BlockOptionsType = {
    isFluid: boolean;
    isEmpty: boolean;
};
declare type BlockType = {
    name: string;
    material: BlockMaterialType;
    options: BlockOptionsType;
};
declare class Registry {
    engine: Engine;
    options: RegistryOptionsType;
    material: ShaderMaterial;
    materials: SmartDictionary<BlockMaterialUVType>;
    blocks: SmartDictionary<BlockType>;
    cBlockDictionary: {
        [key: number]: BlockType;
    };
    cMaterialUVDictionary: {
        [key: string]: BlockMaterialUVType;
    };
    private textureMap;
    private textureAtlas;
    constructor(engine: Engine, options: RegistryOptionsType);
    addMaterial: (name: string, options: MaterialOptionsType) => BlockMaterialUVType | null;
    addBlock: (name: string, material?: BlockMaterialType, options?: Partial<BlockOptionsType>) => number | undefined;
    getMaterialByIndex: (index: number) => BlockMaterialUVType;
    getMaterialIndex: (name: string) => number;
    getMaterial: (name: string) => BlockMaterialUVType | null;
    getBlockByIndex: (index: number) => BlockType;
    getBlockIndex: (name: string) => number;
    getBlock: (name: string) => BlockType | null;
    get mergedTexture(): CanvasTexture;
    private makeCanvasTexture;
    private makeImageTexture;
    private updateCache;
}
export { Registry, RegistryOptionsType };
