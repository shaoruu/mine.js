import Engine from '../..';
import { Entities } from '../entities';

import { IComponentType } from './componentType';

interface IFadeOnZoomState {
  cutoff: number;
  _showing: boolean;
}

/**
 * Component for the player entity, when active hides the player's mesh
 * when camera zoom is less than a certain amount
 */
export function fadeOnZoom(noa: Engine): IComponentType<IFadeOnZoomState> {
  function checkZoom(state: IFadeOnZoomState, id: number, zoom: number, ents: Entities) {
    if (!ents.hasMesh(id)) return;

    if ((state._showing && zoom < state.cutoff) || (!state._showing && zoom > state.cutoff)) {
      const mesh = ents.getMeshData(id).mesh;
      mesh.visibility = state._showing = zoom > state.cutoff;
    }
  }

  return {
    name: 'fadeOnZoom',
    order: 99,
    state: {
      cutoff: 1.5,
      _showing: true,
    },
    system(dt, states) {
      const zoom = noa.camera.currentZoom;
      const ents = noa.entities;
      states.forEach((state) => {
        checkZoom(state, state.__id, zoom, ents);
      });
    },
  };
}
