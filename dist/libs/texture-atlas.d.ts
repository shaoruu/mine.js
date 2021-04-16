import { Texture, CanvasTexture } from 'three';
declare type TextureAtlasOptionsType = {
    textureDimension: number;
};
declare class TextureAtlas {
    options: TextureAtlasOptionsType;
    mergedTexture: CanvasTexture;
    ranges: {
        [key: string]: {
            startV: number;
            endV: number;
            startU: number;
            endU: number;
        };
    };
    dataURLs: {
        [key: string]: string;
    };
    canvas: HTMLCanvasElement;
    constructor(textureMap: {
        [key: string]: Texture;
    }, options?: Partial<TextureAtlasOptionsType>);
    makeCanvasPowerOfTwo(canvas?: HTMLCanvasElement | undefined): void;
}
export { TextureAtlas };
