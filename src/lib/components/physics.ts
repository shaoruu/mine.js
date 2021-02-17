import Engine from '../..';

import { IComponentType } from './componentType';

import * as vec3 from 'gl-vec3';

interface IPhysicsState {
  body: null;
}

export function physics(noa: Engine): IComponentType<IPhysicsState> {
  return {
    name: 'physics',
    order: 40,
    state: {
      body: null,
    },
    onAdd(entID, state) {
      state.body = noa.physics.addBody();
      // implicitly assume body has a position component, to get size
      const posDat = noa.ents.getPositionData(state.__id);
      setPhysicsFromPosition(state, posDat);
    },
    onRemove(entID, state) {
      // update position before removing
      // this lets entity wind up at e.g. the result of a collision
      // even if physics component is removed in collision handler
      if (noa.ents.hasPosition(state.__id)) {
        const pdat = noa.ents.getPositionData(state.__id);
        setPositionFromPhysics(state, pdat);
        backtrackRenderPos(state, pdat, 0, false);
      }
      noa.physics.removeBody(state.body);
    },
    system(dt, states) {
      states.forEach((state) => {
        const pdat = noa.ents.getPositionData(state.__id);
        setPositionFromPhysics(state, pdat);
      });
    },
    renderSystem(dt, states) {
      const tickPos = noa.positionInCurrentTick;
      const tickMS = tickPos * noa._tickRate;

      // tickMS is time since last physics engine tick
      // to avoid temporal aliasing, render the state as if lerping between
      // the last position and the next one
      // since the entity data is the "next" position this amounts to
      // offsetting each entity into the past by tickRate - dt
      // http://gafferongames.com/game-physics/fix-your-timestep/

      const backtrackAmt = (tickMS - noa._tickRate) / 1000;
      states.forEach((state) => {
        const id = state.__id;
        const pdat = noa.ents.getPositionData(id);
        const smoothed = noa.ents.cameraSmoothed(id);
        backtrackRenderPos(state, pdat, backtrackAmt, smoothed);
      });
    },
  };
}

// var offset = vec3.create()
const local = vec3.create();

export function setPhysicsFromPosition(physState: any, posState: any) {
  const box = physState.body.aabb;
  const ext = posState._extents;
  vec3.copy(box.base, ext);
  vec3.set(box.vec, posState.width, posState.height, posState.width);
  vec3.add(box.max, box.base, box.vec);
}

function setPositionFromPhysics(physState: any, posState: any) {
  const base = physState.body.aabb.base;
  const hw = posState.width / 2;
  vec3.set(posState._localPosition, base[0] + hw, base[1], base[2] + hw);
}

function backtrackRenderPos(physState: any, posState: any, backtrackAmt: number, smoothed: boolean) {
  // pos = pos + backtrack * body.velocity
  const vel = physState.body.velocity;
  vec3.scaleAndAdd(local, posState._localPosition, vel, backtrackAmt);

  // smooth out update if component is present
  // (this is set after sudden movements like auto-stepping)
  if (smoothed) vec3.lerp(local, posState._renderPosition, local, 0.3);

  // copy values over to renderPosition,
  vec3.copy(posState._renderPosition, local);
}
