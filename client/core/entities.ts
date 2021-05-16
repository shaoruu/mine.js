import { Object3D, Vector3 } from 'three';

import { AABB, Brain, EntityType, BodyOptionsType } from '../libs';

import { Engine } from './engine';

type EntitiesOptionsType = {
  movementLerp: boolean;
  movementLerpFactor: number;
  maxEntities: number;
};

class Entities {
  public list: Map<string, EntityType> = new Map();

  constructor(public engine: Engine, public options: EntitiesOptionsType) {}

  addEntity(
    name: string,
    object: Object3D,
    size: [number, number, number],
    offsets: [number, number, number] = [0, 0, 0],
    options: Partial<BodyOptionsType> = {},
  ) {
    if (this.list.size >= this.options.maxEntities)
      throw new Error(`Failed to add entity, ${name}: max entities reached.`);

    const { physics } = this.engine;

    const { x, y, z } = object.position;
    const [sx, sy, sz] = size;
    const [ox, oy, oz] = offsets;

    const aabb = new AABB([x - sx / 2 - ox, y - sy / 2 - oy, z - sz / 2 - oz], size);
    const rigidBody = physics.core.addBody({ aabb, ...options });
    const brain = new Brain(rigidBody);

    const newEntity = {
      brain,
      object,
      offsets,
      body: rigidBody,
    };

    this.list.set(name, newEntity);

    return newEntity;
  }

  removeEntity(name: string) {
    const entity = this.list.get(name);
    if (!entity) return;
    this.engine.physics.core.removeBody(entity.body);
    return this.list.delete(name);
  }

  preTick() {
    this.list.forEach((entity) => {
      entity.brain.tick(this.engine.clock.delta);
    });
  }

  tick() {
    const { movementLerp, movementLerpFactor } = this.options;
    this.list.forEach(({ object, body, offsets }) => {
      const [px, py, pz] = this.engine.physics.getPositionFromRB(body);
      if (movementLerp) {
        object.position.lerp(new Vector3(px + offsets[0], py + offsets[1], pz + offsets[2]), movementLerpFactor);
      } else {
        object.position.set(px + offsets[0], py + offsets[1], pz + offsets[2]);
      }
    });
  }
}

export { Entities, EntitiesOptionsType };
