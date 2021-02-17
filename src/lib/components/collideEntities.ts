import Engine, { Vector } from '../..';

import { IBaseComponentState, IComponentType } from './componentType';

import boxIntersect from 'box-intersect';

interface ICollideEntitiesState {
  cylinder: boolean;
  collideBits: number;
  collideMask: number;
  callback: (id: number) => void;
}

/**
 * Every frame, entities with this component will get mutually checked for colliions
 * * cylinder: flag for checking collisions as a vertical cylindar (rather than AABB)
 * * collideBits: category for this entity
 * * collideMask: categories this entity collides with
 * * callback: function(other_id) - called when `own.collideBits & other.collideMask` is true
 *
 * Notes:
 *  Set collideBits=0 for entities like bullets, which can collide with things but are never the target of a collision.
 * 	Set collideMask=0 for things with no callback - things that get collided with, but don't themselves instigate collisions.
 */
export function collideEntities(noa: Engine): IComponentType<ICollideEntitiesState> {
  const intervals: Vector[] = [];

  return {
    name: 'collideEntities',
    order: 70,
    state: {
      cylinder: false,
      collideBits: 1 | 0,
      collideMask: 1 | 0,
      callback: () => {},
    },
    system(dt, states) {
      const ents = noa.ents;

      // data struct that boxIntersect looks for
      // - array of [lo, lo, lo, hi, hi, hi] extents
      for (let i = 0; i < states.length; i++) {
        const id = states[i].__id;
        const dat = ents.getPositionData(id);
        intervals[i] = dat._extents;
      }
      intervals.length = states.length;

      // run the intersect library
      boxIntersect(intervals, function (a, b) {
        const stateA = states[a];
        const stateB = states[b];
        const intervalA = intervals[a];
        const intervalB = intervals[b];
        if (cylindricalHitTest(stateA, stateB, intervalA, intervalB)) {
          handleCollision(noa, stateA, stateB);
        }
      });
    },
  };

  /**
   * IMPLEMENTATION
   */
  function handleCollision(
    noa: Engine,
    stateA: ICollideEntitiesState & IBaseComponentState,
    stateB: ICollideEntitiesState & IBaseComponentState,
  ) {
    const idA = stateA.__id;
    const idB = stateB.__id;

    // entities really do overlap, so check masks and call event handlers
    if (stateA.collideMask & stateB.collideBits) {
      if (stateA.callback) {
        stateA.callback(idB);
      }
    }
    if (stateB.collideMask & stateA.collideBits) {
      if (stateB.callback) {
        stateB.callback(idA);
      }
    }

    // general pairwise handler
    noa.ents.onPairwiseEntityCollision(idA, idB);
  }

  // For entities whose extents overlap,
  // test if collision still happens when taking cylinder flags into account
  function cylindricalHitTest(
    stateA: ICollideEntitiesState & IBaseComponentState,
    stateB: ICollideEntitiesState & IBaseComponentState,
    intervalA: number[],
    intervalB: number[],
  ) {
    if (stateA.cylinder) {
      if (stateB.cylinder) {
        return cylinderCylinderTest(intervalA, intervalB);
      } else {
        return cylinderBoxTest(intervalA, intervalB);
      }
    } else if (stateB.cylinder) {
      return cylinderBoxTest(intervalB, intervalA);
    }
    return true;
  }

  // Cylinder-cylinder hit test (AABBs are known to overlap)
  // given their extent arrays [lo, lo, lo, hi, hi, hi]
  function cylinderCylinderTest(a: number[], b: number[]) {
    // distance between cylinder centers
    const rada = (a[3] - a[0]) / 2;
    const radb = (b[3] - b[0]) / 2;
    const dx = a[0] + rada - (b[0] + radb);
    const dz = a[2] + rada - (b[2] + radb);
    // collide if dist <= sum of radii
    const distsq = dx * dx + dz * dz;
    const radsum = rada + radb;
    return distsq <= radsum * radsum;
  }

  // Cylinder-Box hit test (AABBs are known to overlap)
  // given their extent arrays [lo, lo, lo, hi, hi, hi]
  function cylinderBoxTest(cyl: number[], cube: number[]) {
    // X-z center of cylinder
    const rad = (cyl[3] - cyl[0]) / 2;
    const cx = cyl[0] + rad;
    const cz = cyl[2] + rad;
    // point in X-Z square closest to cylinder
    const px = clamp(cx, cube[0], cube[3]);
    const pz = clamp(cz, cube[2], cube[5]);
    // collision if distance from that point to circle <= cylinder radius
    const dx = px - cx;
    const dz = pz - cz;
    const distsq = dx * dx + dz * dz;
    return distsq <= rad * rad;
  }

  function clamp(val: number, lo: number, hi: number) {
    return val < lo ? lo : val > hi ? hi : val;
  }
}
