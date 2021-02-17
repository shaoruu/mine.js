import Engine from '..';

import createInputs, { GameInputs, IGameInputOptions } from 'game-inputs';

export interface IInputOptions extends IGameInputOptions {
  bindings: {
    [key: string]: [string] | [string, string] | string;
  };
}

/**
 * @typicalname noa.inputs
 * @description Abstracts key/mouse input.
 * For docs see [andyhall/game-inputs](https://github.com/andyhall/game-inputs)
 */
const defaultBindings: IInputOptions = {
  bindings: {
    forward: ['W', '<up>'],
    left: ['A', '<left>'],
    backward: ['S', '<down>'],
    right: ['D', '<right>'],
    fire: '<mouse 1>',
    'mid-fire': ['<mouse 2>', 'Q'],
    'alt-fire': ['<mouse 3>', 'E'],
    jump: '<space>',
    sprint: '<shift>',
    crouch: '<control>',
  },
};

export function makeInputs(noa: Engine, options: Partial<IInputOptions>, element: HTMLElement): GameInputs {
  const optionsWithDefaults = {
    ...defaultBindings,
    ...options,
  };

  const inputs = createInputs(element, optionsWithDefaults);
  const b = optionsWithDefaults.bindings;
  for (const name in b) {
    const arr = Array.isArray(b[name]) ? b[name] : ([b[name]] as any);
    arr.unshift(name);
    inputs.bind.apply(inputs, arr);
  }
  return inputs;
}
