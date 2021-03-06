import vec3 from 'gl-vec3';

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
    return coords[0] + concat + coords[1] + concat + coords[2];
  };

  /**
   * Scale coordinates and floor them.
   *
   * @param {Coords3} coords
   * @param {number} factor
   * @returns
   */
  public static scaleCoordsF = (coords: Coords3, factor: number): Coords3 => {
    const result = [0, 0, 0];
    const scaled = vec3.scale(result, coords, factor);
    return vec3.floor(scaled, scaled) as Coords3;
  };

  /**
   * Map voxel position to local position in current chunk.
   *
   * @param {Coords3} worldPos
   * @param {Chunk} chunk
   * @returns {Coords3}
   */
  public static mapVoxelPosToChunkLocalPos = (voxelPos: Coords3, chunkSize: number): Coords3 => {
    const [vx, vy, vz] = voxelPos;

    return [vx % chunkSize, vy % chunkSize, vz % chunkSize];
  };

  /**
   * Map voxel position to the current chunk position.
   *
   * @param {Coords3} worldPos
   * @param {number} chunkSize
   * @returns {Coords3}
   */
  public static mapVoxelPosToChunkPos = (voxelPos: Coords3, chunkSize: number): Coords3 => {
    return Helper.scaleCoordsF(voxelPos, 1 / chunkSize);
  };

  /**
   * Get the voxel position of a chunk position.
   *
   * @static
   * @param {Coords3} chunkPos
   * @param {number} chunkSize
   * @memberof Helper
   */
  public static mapChunkPosToVoxelPos = (chunkPos: Coords3, chunkSize: number): Coords3 => {
    const result = [0, 0, 0] as Coords3;

    vec3.copy(result, chunkPos);
    vec3.scale(result, result, chunkSize);

    return result;
  };

  /**
   * Map world position to voxel position.
   *
   * @param {Coords3} worldPos
   * @param {number} dimension
   * @returns {Coords3}
   */
  public static mapWorldPosToVoxelPos = (worldPos: Coords3, dimension: number): Coords3 => {
    return Helper.scaleCoordsF(worldPos, 1 / dimension);
  };

  /**
   * Apply style to given element.
   *
   * @param {HTMLElement} ele
   * @param {Partial<CSSStyleDeclaration>} style
   * @returns {HTMLElement}
   */
  public static applyStyle = (ele: HTMLElement, style: Partial<CSSStyleDeclaration>) => {
    Object.keys(style).forEach((key: string) => {
      const attribute = style[key];
      ele.style[key] = attribute;
    });

    return ele;
  };

  public static loadWorker = (worker: string) => {
    if (!window.Worker) throw new Error('Web-workers not supported.');

    const blob = new Blob([worker], { type: 'javascript' });
    const url = URL.createObjectURL(blob);

    return new Worker(url);
  };
}

export { Helper };
