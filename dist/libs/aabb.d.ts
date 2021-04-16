declare class AABB {
    base: number[];
    vec: number[];
    max: number[];
    mag: number;
    constructor(pos: number[], vec: number[]);
    width: () => number;
    height: () => number;
    depth: () => number;
    x0: () => number;
    y0: () => number;
    z0: () => number;
    x1: () => number;
    y1: () => number;
    z1: () => number;
    translate: (by: number[]) => this;
    setPosition: (pos: number[]) => this;
    expand: (aabb: AABB) => AABB;
    intersects: (aabb: AABB) => boolean;
    touches: (aabb: AABB) => boolean;
    union: (aabb: AABB) => AABB | null;
}
export { AABB };
