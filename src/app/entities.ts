import { Object3D, Vector3 } from 'three';

import { Engine } from '..';
import { AABB, Brain, EntityType, RigidBody, SmartDictionary } from '../libs';
import { BodyOptionsType } from '../libs/types';

type EntitiesOptionsType = {
  movementLerp: boolean;
  movementLerpFactor: number;
  maxEntities: number;
};

class Entities {
  public options: EntitiesOptionsType;

  public engine: Engine;

  public list: SmartDictionary<EntityType> = new SmartDictionary();

  constructor(engine: Engine, options: EntitiesOptionsType) {
    this.engine = engine;
    this.options = options;
  }

  addEntity(
    name: string,
    object: Object3D,
    size: [number, number, number],
    offsets: [number, number, number] = [0, 0, 0],
    options: Partial<BodyOptionsType> = {},
  ) {
    if (this.list.data.length >= this.options.maxEntities)
      throw new Error(`Failed to add entity, ${name}: max entities reached.`);

    const { physics } = this.engine;

    const aabb = new AABB(object.position.toArray(), size);
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

  preTick() {
    this.list.data.forEach((entity) => {
      entity.brain.tick(this.engine.clock.delta);
    });
  }

  tick() {
    const { movementLerp, movementLerpFactor } = this.options;
    this.list.data.forEach(({ object, body, offsets }) => {
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
