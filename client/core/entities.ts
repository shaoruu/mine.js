import { Object3D, Vector3, LoadingManager, AmbientLight } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

import { AABB, Brain, PhysicalType, BodyOptionsType, Coords3, EntityType, createMaterial_ } from '../libs';
import { Entity } from '../libs/entity';
import { Helper } from '../utils';

import { Engine } from './engine';

type EntityPrototype = {
  etype: string;
  brain: string;
  model: string;
  rigidbody: {
    aabb: [number, number, number];
    autoStep: boolean;
    friction: number;
    gravityMultiplier: number;
    mass: number;
    restitution: number;
  };
};

type EntitiesOptionsType = {
  movementLerp: boolean;
  movementLerpFactor: number;
  maxEntities: number;
  maxProcessPerFrame: number;
  prototypes?: { [key: string]: EntityPrototype };
};

class Entities {
  public physicals: Map<string, PhysicalType> = new Map();
  public entities: Map<string, EntityType> = new Map();

  private updates: [string, string, Coords3, [number, number, number, number], Coords3][] = [];
  private prototypes: Map<string, Entity> = new Map();

  constructor(public engine: Engine, public options: EntitiesOptionsType) {
    engine.on('ready', () => {
      const { prototypes } = this.options;

      const keys = Object.keys(prototypes);

      engine.rendering.scene.add(new AmbientLight());

      let count = 0;
      const onFinish = (name: string, obj: Object3D) => {
        count++;

        const prototype = new Entity(this, name, obj);

        const scale = prototypes[name].rigidbody.aabb;
        prototype.mesh.position.set(0.5, 53.5, -0.5);
        prototype.mesh.rotateY(Math.PI / 2);
        prototype.mesh.scale.set(...scale);
        prototype.mesh.scale.multiplyScalar(5);

        engine.rendering.scene.add(prototype.mesh);

        this.prototypes.set(name.toLowerCase(), prototype);

        if (count === keys.length) {
          engine.emit('entities-loaded');
        }
      };

      const manager = new LoadingManager();
      const gltfLoader = new GLTFLoader(manager);
      gltfLoader.setPath(Helper.getServerURL({ path: '/models/', clear: true }).toString());

      keys.forEach((name) => {
        const { model } = prototypes[name];

        gltfLoader.load(model, (obj) => {
          onFinish(name, obj.scene);
        });
      });
    });
  }

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

  getObject = (type: string): Entity => {
    return this.prototypes.get(type.toLowerCase()).clone();
  };

  handleServerUpdate = (
    id: string,
    type: string,
    position: Coords3,
    rotation: [number, number, number, number],
    lookAt?: Coords3,
  ) => {
    this.updates.push([id, type, position, rotation, lookAt]);
  };

  updateEntity = (id: string, type: string, position: Coords3, rotation: [...Coords3, number], lookAt?: Coords3) => {
    if (!this.engine.assetsLoaded) return;

    let entity = this.entities.get(id);

    if (!entity) {
      const object = this.getObject(type);

      this.engine.rendering.scene.add(object.mesh);

      entity = {
        type,
        object,
        position,
        rotation,
      };
    } else {
      entity.position = position;
      if (lookAt.length > 0) {
        entity.object.setTarget(new Vector3(...lookAt));
      } else {
        entity.rotation = rotation;
      }
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
    const { maxProcessPerFrame } = this.options;

    this.updates.splice(0, maxProcessPerFrame).forEach((update) => {
      this.updateEntity(...update);
    });

    this.physicals.forEach((entity) => {
      if (entity.brain) {
        entity.brain.tick(this.engine.clock.delta);
      }
    });

    this.entities.forEach((p) => {
      p.object.tick();
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
        object.mesh.position.lerp(new Vector3(px, py, pz), movementLerpFactor);
      } else {
        object.mesh.position.set(px, py, pz);
      }
    });
  };
}

export { Entities, EntitiesOptionsType };
