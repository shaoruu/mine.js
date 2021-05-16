declare module '!raw-loader!*' {
  const value: string;
  export default value;
}

declare module 'fast-voxel-raycast' {
  type Vector = [number, number, number];

  function traceRay<T = string>(
    getVoxel: (x: number, y: number, z: number) => T,
    origin: any,
    direction: Vector,
    max_d?: number,
    hit_pos?: number[],
    hit_norm: number[],
  ): 0 | T;

  export default traceRay;
}

declare module '*.glsl' {
  const value: string;
  export default value;
}

declare module 'voxel-aabb-sweep';
