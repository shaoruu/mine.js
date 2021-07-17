import { Object3D, Vector3, BoxBufferGeometry, Mesh } from 'three';

import { AABB, Brain, PhysicalType, BodyOptionsType, Coords3, EntityType } from '../libs';

import { Engine } from './engine';

type EntitiesOptionsType = {
  movementLerp: boolean;
  movementLerpFactor: number;
  maxEntities: number;
};

class Entities {
  public physicals: Map<string, PhysicalType> = new Map();
  public entities: Map<string, EntityType> = new Map();

  constructor(public engine: Engine, public options: EntitiesOptionsType) {}

  addPhysical = (
    name: string,
    object: Object3D,
    size: [number, number, number],
    offsets: [number, number, number] = [0, 0, 0],
    needsBrain = true,
    options: Partial<BodyOptionsType> = {},
  ) => {
    if (this.physicals.size >= this.options.maxEntities)
      throw new Error(`Failed to add entity, ${name}: max entities reached.`);

    const { physics } = this.engine;

    const { x, y, z } = object.position;
    const [sx, sy, sz] = size;
    const [ox, oy, oz] = offsets;

    const aabb = new AABB([x - sx / 2 - ox, y - sy / 2 - oy, z - sz / 2 - oz], size);
    const rigidBody = physics.core.addBody({ aabb, ...options });

    const brain = needsBrain ? new Brain(rigidBody) : null;

    const newPhysical = {
      name,
      brain,
      object,
      offsets,
      body: rigidBody,
    };

    this.physicals.set(name, newPhysical);

    return newPhysical;
  };

  getObject = (type: string): Object3D => {
    switch (type.toLowerCase()) {
      case 'cow': {
        const geo = new BoxBufferGeometry(0.2, 0.2, 0.2);
        const mesh = new Mesh(geo);
        return mesh;
      }
    }
  };

  updateEntity = (id: string, type: string, position: Coords3, rotation: [...Coords3, number]) => {
    let entity = this.entities.get(id);

    if (!entity) {
      const object = this.getObject(type);

      this.engine.rendering.scene.add(object);

      entity = {
        type,
        object,
        position,
        rotation,
      };
    } else {
      entity.position = position;
      entity.rotation = rotation;
    }

    this.entities.set(id, entity);

    return entity;
  };

  removePhysical = (name: string) => {
    const entity = this.physicals.get(name);
    if (!entity) return;
    this.engine.physics.core.removeBody(entity.body);
    return this.physicals.delete(name);
  };

  preTick = () => {
    this.physicals.forEach((entity) => {
      if (entity.brain) {
        entity.brain.tick(this.engine.clock.delta);
      }
    });
  };

  tick = () => {
    const { movementLerp, movementLerpFactor } = this.options;
    this.physicals.forEach(({ object, body, offsets }) => {
      const [px, py, pz] = this.engine.physics.getPositionFromRB(body);
      if (movementLerp) {
        object.position.lerp(new Vector3(px + offsets[0], py + offsets[1], pz + offsets[2]), movementLerpFactor);
      } else {
        object.position.set(px + offsets[0], py + offsets[1], pz + offsets[2]);
      }
    });
    this.entities.forEach(({ object, position: [px, py, pz] }) => {
      if (movementLerp) {
        object.position.lerp(new Vector3(px, py, pz), movementLerpFactor);
      } else {
        object.position.set(px, py, pz);
      }
    });
  };
}

export { Entities, EntitiesOptionsType };
