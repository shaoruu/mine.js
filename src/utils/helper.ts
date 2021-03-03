import { Coords3 } from '../libs';
import vec3 from 'gl-vec3';

class Helper {
  /**
   * Given a coordinate of a chunk, return the chunk representation.
   *
   * @param {Coords3} coords
   * @param {string} [concat='|']
   * @returns
   */
  public static getChunkName = (coords: Coords3, concat = '|') => {
    return coords.join(concat);
  };

  /**
   * Scale coordinates and floor them.
   *
   * @param {Coords3} coords
   * @param {number} factor
   * @returns
   */
  public static scaleCoordsF = (coords: Coords3, factor: number) => {
    const scaled = vec3.scale(coords, coords, factor);
    return vec3.floor(scaled, scaled);
  };

  /**
   * Map voxel position to local position in current chunk.
   *
   * @param {Coords3} worldPos
   * @param {Chunk} chunk
   * @returns
   */
  public static vMapVoxelPosToChunkLocalPos = (worldPos: Coords3, chunkSize: number) => {
    const [vx, vy, vz] = worldPos;

    return [vx % chunkSize, vy % chunkSize, vz % chunkSize];
  };

  /**
   * Map voxel position to the current chunk position.
   *
   * @param {Coords3} worldPos
   * @param {number} chunkSize
   * @returns
   */
  public static vMapVoxelPosToChunkPos = (worldPos: Coords3, chunkSize: number) => {
    return Helper.scaleCoordsF(worldPos, 1 / chunkSize);
  };

  /**
   * Map world position to voxel position.
   *
   * @param {Coords3} worldPos
   * @param {number} dimension
   * @returns
   */
  public static vMapWorldPosToVoxelPos = (worldPos: Coords3, dimension: number) => {
    return Helper.scaleCoordsF(worldPos, 1 / dimension);
  };

  /**
   * Apply style to given element.
   *
   * @param {HTMLElement} ele
   * @param {Partial<CSSStyleDeclaration>} style
   * @returns
   */
  public static applyStyle = (ele: HTMLElement, style: Partial<CSSStyleDeclaration>) => {
    Object.keys(style).forEach((key: string) => {
      const attribute = style[key];
      ele.style[key] = attribute;
    });

    return ele;
  };
}

export { Helper };
