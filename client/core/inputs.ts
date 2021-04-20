import Mousetrap from 'mousetrap';

import { SmartDictionary } from '../../shared';

import { Engine } from './engine';
class Inputs {
  public engine: Engine;
  public combos: SmartDictionary<string> = new SmartDictionary();
  public callbacks: SmartDictionary<() => void> = new SmartDictionary();

  constructor(engine: Engine) {
    this.engine = engine;

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
