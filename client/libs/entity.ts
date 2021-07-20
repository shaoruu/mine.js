import { Mesh, Vector3, Object3D } from 'three';

import { Entities } from '../core';

class Entity {
  public head: Mesh;
  public torso: Mesh;
  public arms: { left: Mesh; right: Mesh };
  public legs: { left: Mesh; right: Mesh };

  public target = new Vector3();

  private currLooking = new Vector3();

  constructor(public entities: Entities, public etype: string, public prototype: Object3D) {
    const { children } = prototype;
    this.head = children.find((c) => c.name.toLowerCase() === 'head') as Mesh;
    this.torso = children.find((c) => c.name.toLowerCase() === 'torso') as Mesh;

    this.arms = {
      left: children.find((c) => c.name.toLowerCase() === 'left_arm') as Mesh,
      right: children.find((c) => c.name.toLowerCase() === 'right_arm') as Mesh,
    };

    this.legs = {
      left: children.find((c) => c.name.toLowerCase() === 'left_leg') as Mesh,
      right: children.find((c) => c.name.toLowerCase() === 'right_leg') as Mesh,
    };
  }

  tick = () => {
    this.lerpAll();
    this.playIdleAnimation();
    this.playLookingAnimation();
  };

  lerpAll = () => {
    if (this.target) {
      this.currLooking.lerp(this.target, 0.4);
    }
  };

  playIdleAnimation = () => {
    const speed = 0.0006;
    const amplitude = 0.12;
    this.arms.left.rotation.x = Math.sin(performance.now() * speed) * amplitude;
    this.arms.right.rotation.x = Math.cos(performance.now() * speed) * amplitude;
    this.arms.left.rotation.z = Math.cos(performance.now() * speed) ** 2 * amplitude;
    this.arms.right.rotation.z = -(Math.sin(performance.now() * speed) ** 2 * amplitude);
  };

  playLookingAnimation = () => {
    if (this.target) {
      this.head.lookAt(this.currLooking);
    } else {
      this.head.rotation.set(0, 0, 0);
    }
  };

  setTarget = (target: Vector3) => {
    this.target = target;
  };

  lookAt = (position: Vector3) => {
    this.head.lookAt(position);
  };

  clone = () => {
    return new Entity(this.entities, this.etype, this.prototype.clone());
  };

  get mesh() {
    return this.prototype;
  }
}

export { Entity };
