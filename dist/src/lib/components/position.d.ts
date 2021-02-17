import Engine, { Vector } from '../..';
import { IComponentType } from './componentType';
/**
 * Component holding entity's position, width, and height.
 * By convention, entity's "position" is the bottom center of its AABB
 *
 * Of the various properties, _localPosition is the "real",
 * single-source-of-truth position. Others are derived.
 * Local coords are relative to `noa.worldOriginOffset`.
 *
 * Props:
 *     position: pos in global coords (may be low precision)
 *     _localPosition: precise pos in local coords
 *     _renderPosition: [x,y,z] in LOCAL COORDS
 *     _extents: array [lo, lo, lo, hi, hi, hi] in LOCAL COORDS
 *
 */
export declare function position(noa: Engine): IComponentType<{
    position: null | Vector;
    width: number;
    height: number;
    _localPosition: null | Vector;
    _renderPosition: null | Vector;
    _extents: null | Float32Array;
}>;
export declare function updatePositionExtents(state: any): void;
