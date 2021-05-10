import Mousetrap from 'mousetrap';

import { Engine } from './engine';

type ClickType = 'left' | 'middle' | 'right';

class Inputs {
  public combos: Map<string, string> = new Map();
  public callbacks: Map<string, () => void> = new Map();
  public clickCallbacks: Map<ClickType, (() => void)[]> = new Map();

  constructor(public engine: Engine) {
    this.add('forward', 'w');
    this.add('backward', 's');
    this.add('left', 'a');
    this.add('right', 'd');
    this.add('space', 'space');
    this.add('dbl-space', 'space space');

    this.initClickListener();
  }

  initClickListener() {
    (['left', 'middle', 'right'] as ClickType[]).forEach((type) => this.clickCallbacks.set(type, []));

    document.addEventListener(
      'mousedown',
      ({ button }) => {
        if (!this.engine.locked) return;

        let callbacks: (() => void)[];

        if (button === 0) callbacks = this.clickCallbacks.get('left');
        else if (button === 1) callbacks = this.clickCallbacks.get('middle');
        else if (button === 2) callbacks = this.clickCallbacks.get('right');

        callbacks.forEach((func) => func());
      },
      false,
    );
  }

  click(type: ClickType, callback: () => void) {
    this.clickCallbacks.get(type).push(callback);
  }

  add(name: string, combo: string) {
    this.combos.set(name, combo);
  }

  bind(name: string, callback: () => void) {
    let combo = this.combos.get(name);

    if (!combo) {
      if (name.length === 1) {
        // single keys
        this.add(name, name);
        combo = name;
      } else {
        throw new Error(`Error registering input, ${name}: not found.`);
      }
    }

    Mousetrap.bind(combo, callback);
  }

  unbind(name: string) {
    const combo = this.combos.get(name);
    if (combo) Mousetrap.unbind(combo);
  }
}

export { Inputs };
