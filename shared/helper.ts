import vec3 from 'gl-vec3';

import { Coords2, Coords3 } from '../shared';

class Helper {
  public static getChunkName = (coords: Coords2, concat = '_') => {
    return coords[0] + concat + coords[1];
  };

  public static getVoxelName = (coords: Coords3, concat = '_') => {
    return coords[0] + concat + coords[1] + concat + coords[2];
  };

  public static parseChunkName = (name: string, concat = '_') => {
    return name.split(concat).map((s: string) => parseInt(s, 10));
  };

  public static scaleCoordsF = (coords: Coords3, factor: number): Coords3 => {
    const result = [0, 0, 0];
    const scaled = vec3.scale(result, coords, factor);
    return <Coords3>vec3.floor(scaled, scaled);
  };

  public static mapVoxelPosToChunkLocalPos = (voxelPos: Coords3, chunkSize: number): Coords3 => {
    const [cx, cz] = Helper.mapVoxelPosToChunkPos(voxelPos, chunkSize);
    const [vx, vy, vz] = voxelPos;

    return [vx - cx * chunkSize, vy, vz - cz * chunkSize];
  };

  public static mapVoxelPosToChunkPos = (voxelPos: Coords3, chunkSize: number): Coords2 => {
    const coords3 = Helper.scaleCoordsF(voxelPos, 1 / chunkSize);
    return [coords3[0], coords3[2]];
  };

  public static mapChunkPosToVoxelPos = (chunkPos: Coords3, chunkSize: number): Coords3 => {
    const result = <Coords3>[0, 0, 0];

    vec3.copy(result, chunkPos);
    vec3.scale(result, result, chunkSize);

    return result;
  };

  public static mapWorldPosToVoxelPos = (worldPos: Coords3, dimension: number): Coords3 => {
    return Helper.scaleCoordsF(worldPos, 1 / dimension);
  };

  public static applyStyle = (ele: HTMLElement, style: Partial<CSSStyleDeclaration>) => {
    Object.keys(style).forEach((key: string) => {
      const attribute = style[key];
      ele.style[key] = attribute;
    });

    return ele;
  };

  public static approxEquals = (a: number, b: number) => {
    return Math.abs(a - b) < 1e-5;
  };
}

export { Helper };
