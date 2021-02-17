import Engine from '../..';
import { IComponentType } from './componentType';
/**
 * Input processing component - gets (key) input state and
 * applies it to receiving entities by updating their movement
 * component state (heading, movespeed, jumping, etc.)
 */
export declare function receivesInputs(noa: Engine): IComponentType;
