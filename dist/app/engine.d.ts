import { EventEmitter } from 'events';
import { Clock } from '../libs';
import { Camera, CameraOptionsType, Container, ContainerOptionsType, Debug, Entities, EntitiesOptionsType, Inputs, Physics, PhysicsOptionsType, Registry, RegistryOptionsType, Rendering, RenderingOptionsType, World, WorldOptionsType } from '.';
declare type ConfigType = {
    debug: boolean;
    containerOptions: ContainerOptionsType;
    cameraOptions: CameraOptionsType;
    worldOptions: WorldOptionsType;
    entitiesOptions: EntitiesOptionsType;
    physicsOptions: PhysicsOptionsType;
    registryOptions: RegistryOptionsType;
    renderingOptions: RenderingOptionsType;
};
declare class Engine extends EventEmitter {
    config: ConfigType;
    debug: Debug;
    clock: Clock;
    container: Container;
    rendering: Rendering;
    inputs: Inputs;
    camera: Camera;
    registry: Registry;
    world: World;
    physics: Physics;
    entities: Entities;
    paused: boolean;
    constructor(params?: Partial<ConfigType>);
    boot: () => void;
    tick: () => void;
    render: () => void;
    start: () => void;
    pause: () => void;
    get isLocked(): boolean;
}
export { Engine };
