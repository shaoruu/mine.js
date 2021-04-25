import Mousetrap from 'mousetrap';

import { Engine } from './engine';
class Inputs {
  public combos: Map<string, string> = new Map();
  public callbacks: Map<string, () => void> = new Map();

  constructor(public engine: Engine) {
    this.add('forward', 'w');
    this.add('backward', 's');
    this.add('left', 'a');
    this.add('right', 'd');
  }

  add(name: string, combo: string) {
    this.combos.set(name, combo);
  }

  bind(name: string, callback: () => void) {
    const combo = this.combos.get(name);

    if (!combo) {
      throw new Error(`Error registering input, ${name}: not found.`);
    }

    Mousetrap.bind(combo, callback);
  }

  unbind(name: string) {
    const combo = this.combos.get(name);
    if (combo) Mousetrap.unbind(combo);
  }
}

export { Inputs };
