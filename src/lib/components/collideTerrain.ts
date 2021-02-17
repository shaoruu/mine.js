import Engine from '../..';

import { IComponentType } from './componentType';

interface ICollideTerrainState {
  callback: (impulse: any, eid: number) => void | null;
}

export function collideTerrain(noa: Engine): IComponentType<ICollideTerrainState> {
  return {
    name: 'collideTerrain',
    order: 0,
    state: {
      callback: () => {},
    },
    onAdd(eid, state) {
      // add collide handler for physics engine to call
      const ents = noa.entities;
      if (ents.hasPhysics(eid)) {
        const body = ents.getPhysicsBody(eid);
        body.onCollide = function bodyOnCollide(impulse: any) {
          const cb = noa.ents.getCollideTerrain(eid).callback;
          if (cb) {
            cb(impulse, eid);
          }
        };
      }
    },
    onRemove(eid, state) {
      const ents = noa.entities;
      if (ents.hasPhysics(eid)) {
        ents.getPhysicsBody(eid).onCollide = null;
      }
    },
  };
}
