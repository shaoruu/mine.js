import Url from 'domurl';
import vec3 from 'gl-vec3';

import { Coords2, Coords3 } from '../../shared';
import { AABB } from '../libs';

class Helper {
  /**
   * Given a coordinate of a chunk, return the chunk representation.
   *
   * @param {Coords3} coords
   * @param {string} [concat='|']
   * @returns
   */
  public static getChunkName = (coords: Coords2, concat = '|') => {
    return coords[0] + concat + coords[1];
  };

  /**
   * Given a chunk name, return the coordinates of the chunk
   *
   * @param {string} name
   * @param {string} [concat='|']
   * @returns
   */
  public static parseChunkName = (name: string, concat = '|') => {
    return name.split(concat).map((s: string) => parseInt(s, 10));
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
    return <Coords3>vec3.floor(scaled, scaled);
  };

  /**
   * Map voxel position to local position in current chunk.
   *
   * @param {Coords3} worldPos
   * @param {Chunk} chunk
   * @returns {Coords3}
   */
  public static mapVoxelPosToChunkLocalPos = (voxelPos: Coords3, chunkSize: number): Coords3 => {
    const [cx, cz] = Helper.mapVoxelPosToChunkPos(voxelPos, chunkSize);
    const [vx, vy, vz] = voxelPos;

    return [vx - cx * chunkSize, vy, vz - cz * chunkSize];
  };

  /**
   * Map voxel position to the current chunk position.
   *
   * @param {Coords3} worldPos
   * @param {number} chunkSize
   * @returns {Coords2}
   */
  public static mapVoxelPosToChunkPos = (voxelPos: Coords3, chunkSize: number): Coords2 => {
    const coords3 = Helper.scaleCoordsF(voxelPos, 1 / chunkSize);
    return [coords3[0], coords3[2]];
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
    const result = <Coords3>[0, 0, 0];

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

  public static approxEquals = (a: number, b: number) => {
    return Math.abs(a - b) < 1e-5;
  };

  public static cloneAABB = (tgt: AABB, src: AABB) => {
    for (let i = 0; i < 3; i++) {
      tgt.base[i] = src.base[i];
      tgt.max[i] = src.max[i];
      tgt.vec[i] = src.vec[i];
    }
  };

  public static getServerURL = () => {
    const url = new Url();
    if (url.host === 'localhost') {
      url.port = '4000';
    }
    return url;
  };
}

export { Helper };
