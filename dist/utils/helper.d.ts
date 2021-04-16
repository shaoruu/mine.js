import { AABB, Coords2, Coords3 } from '../libs';
declare class Helper {
    /**
     * Given a coordinate of a chunk, return the chunk representation.
     *
     * @param {Coords3} coords
     * @param {string} [concat='|']
     * @returns
     */
    static getChunkName: (coords: Coords2, concat?: string) => string;
    /**
     * Given a chunk name, return the coordinates of the chunk
     *
     * @param {string} name
     * @param {string} [concat='|']
     * @returns
     */
    static parseChunkName: (name: string, concat?: string) => number[];
    /**
     * Scale coordinates and floor them.
     *
     * @param {Coords3} coords
     * @param {number} factor
     * @returns
     */
    static scaleCoordsF: (coords: Coords3, factor: number) => Coords3;
    /**
     * Map voxel position to local position in current chunk.
     *
     * @param {Coords3} worldPos
     * @param {Chunk} chunk
     * @returns {Coords3}
     */
    static mapVoxelPosToChunkLocalPos: (voxelPos: Coords3, chunkSize: number) => Coords3;
    /**
     * Map voxel position to the current chunk position.
     *
     * @param {Coords3} worldPos
     * @param {number} chunkSize
     * @returns {Coords2}
     */
    static mapVoxelPosToChunkPos: (voxelPos: Coords3, chunkSize: number) => Coords2;
    /**
     * Get the voxel position of a chunk position.
     *
     * @static
     * @param {Coords3} chunkPos
     * @param {number} chunkSize
     * @memberof Helper
     */
    static mapChunkPosToVoxelPos: (chunkPos: Coords3, chunkSize: number) => Coords3;
    /**
     * Map world position to voxel position.
     *
     * @param {Coords3} worldPos
     * @param {number} dimension
     * @returns {Coords3}
     */
    static mapWorldPosToVoxelPos: (worldPos: Coords3, dimension: number) => Coords3;
    /**
     * Apply style to given element.
     *
     * @param {HTMLElement} ele
     * @param {Partial<CSSStyleDeclaration>} style
     * @returns {HTMLElement}
     */
    static applyStyle: (ele: HTMLElement, style: Partial<CSSStyleDeclaration>) => HTMLElement;
    static loadWorker: (worker: string) => Worker;
    static approxEquals: (a: number, b: number) => boolean;
    static cloneAABB: (tgt: AABB, src: AABB) => void;
}
export { Helper };
