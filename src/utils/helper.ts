import { Coords3 } from '../libs';

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
   * Scale and floor coordinates
   *
   * @param {Coords3} coords
   * @param {*} factor
   */
  public static scaleCoordsF = (coords: Coords3, factor: number): Coords3 => {
    return [(coords[0] * factor) | 0, (coords[1] * factor) | 0, (coords[2] * factor) | 0];
  };

  /**
   * Map voxel position to local position in current chunk.
   *
   * @param {Coords3} worldPos
   * @param {Chunk} chunk
   * @returns {Coords3}
   */
  public static vMapVoxelPosToChunkLocalPos = (worldPos: Coords3, chunkSize: number): Coords3 => {
    const [vx, vy, vz] = worldPos;

    return [vx % chunkSize, vy % chunkSize, vz % chunkSize];
  };

  /**
   * Map voxel position to the current chunk position.
   *
   * @param {Coords3} worldPos
   * @param {number} chunkSize
   * @returns {Coords3}
   */
  public static vMapVoxelPosToChunkPos = (worldPos: Coords3, chunkSize: number): Coords3 => {
    return Helper.scaleCoordsF(worldPos, 1 / chunkSize);
  };

  /**
   * Map world position to voxel position.
   *
   * @param {Coords3} worldPos
   * @param {number} dimension
   * @returns {Coords3}
   */
  public static vMapWorldPosToVoxelPos = (worldPos: Coords3, dimension: number): Coords3 => {
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
