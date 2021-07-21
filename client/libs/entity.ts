import { Mesh, Vector3, Object3D } from 'three';

import { Entities } from '../core';

import { Coords3 } from './types';

const WALKING_SPEED = 0.8;
const IDLE_ARM_SPEED = 0.06;

class Entity {
  public head: Mesh;
  public torso: Mesh;
  public arms: { left: Mesh; right: Mesh };
  public legs: { left: Mesh; right: Mesh };

  public speed = 0;
  public target: Vector3 = null;

  public newPosition = new Vector3();
  private currLooking = new Vector3();
  private bodyLooking = new Vector3();

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
    this.calculateDelta();
    this.playLookingAnimation();
    this.playArmSwingAnimation();
    this.playWalkingAnimation();
  };

  calculateDelta = () => {
    const p1 = this.mesh.position.clone();
    const p2 = this.newPosition.clone();
    p1.y = p2.y = 0;
    const dist = p1.distanceTo(p2);
    if (dist > 0.001) this.speed = WALKING_SPEED;
    else this.speed = 0;
  };

  lerpAll = () => {
    if (this.target) {
      this.currLooking.lerp(this.target, 0.4);
      this.bodyLooking.lerp(this.target, 0.05);
      this.bodyLooking.y = this.mesh.position.y;
    }

    if (this.newPosition.length() !== 0) {
      this.mesh.position.lerp(this.newPosition, 0.7);
    }
  };

  playArmSwingAnimation = () => {
    const scale = 100;
    const speed = Math.max(this.speed, IDLE_ARM_SPEED);
    const amplitude = speed * 1;

    if (this.arms.left) {
      this.arms.left.rotation.x = Math.sin((performance.now() * speed) / scale) * amplitude;
      this.arms.left.rotation.z = Math.cos((performance.now() * speed) / scale) ** 2 * amplitude * 0.1;
    }

    if (this.arms.right) {
      this.arms.right.rotation.x = Math.sin((performance.now() * speed) / scale + Math.PI) * amplitude;
      this.arms.right.rotation.z = -(Math.sin((performance.now() * speed) / scale) ** 2 * amplitude * 0.1);
    }
  };

  playLookingAnimation = () => {
    if (this.target) {
      this.head.lookAt(this.currLooking);
      this.mesh.lookAt(this.bodyLooking);
    }
  };

  playWalkingAnimation = () => {
    const scale = 100;
    const amplitude = this.speed * 1;

    if (this.legs.left) {
      this.legs.left.rotation.x = -Math.sin((performance.now() * this.speed) / scale) * amplitude;
    }

    if (this.legs.right) {
      this.legs.right.rotation.x = Math.sin((performance.now() * this.speed) / scale) * amplitude;
    }
  };

  setTarget = (target: Vector3) => {
    this.target = target;
  };

  setPosition = (position: Coords3) => {
    this.newPosition = new Vector3(...position);
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
