import Mousetrap from 'mousetrap';

import { Engine } from './engine';

type ClickType = 'left' | 'middle' | 'right';
type InputNamespace = 'in-game' | 'chat' | 'menu' | '*';
type InputOccasion = 'keydown' | 'keypress' | 'keyup';
type ClickCallbacksType = { callback: () => void; namespace: InputNamespace }[];

class Inputs {
  public namespace: InputNamespace = 'menu';
  public combos: Map<string, string> = new Map();
  public callbacks: Map<string, () => void> = new Map();
  public clickCallbacks: Map<ClickType, ClickCallbacksType> = new Map();

  constructor(public engine: Engine) {
    this.add('forward', 'w');
    this.add('backward', 's');
    this.add('left', 'a');
    this.add('right', 'd');
    this.add('space', 'space');
    this.add('dbl-space', 'space space');
    this.add('esc', 'esc');
    this.add('up', 'up');
    this.add('down', 'down');
    this.add('enter', 'enter');

    this.initClickListener();
  }

  initClickListener() {
    (['left', 'middle', 'right'] as ClickType[]).forEach((type) => this.clickCallbacks.set(type, []));

    document.addEventListener(
      'mousedown',
      ({ button }) => {
        if (!this.engine.locked) return;

        let callbacks: ClickCallbacksType = [];

        if (button === 0) callbacks = this.clickCallbacks.get('left');
        else if (button === 1) callbacks = this.clickCallbacks.get('middle');
        else if (button === 2) callbacks = this.clickCallbacks.get('right');

        callbacks.forEach(({ namespace, callback }) => {
          if (this.namespace === namespace) callback();
        });
      },
      false,
    );
  }

  click(type: ClickType, callback: () => void, namespace: InputNamespace) {
    this.clickCallbacks.get(type).push({ namespace, callback });
  }

  add(name: string, combo: string) {
    this.combos.set(name, combo);
  }

  bind(
    name: string,
    callback: () => void,
    namespace: InputNamespace,
    { occasion = 'keydown' }: { occasion?: InputOccasion } = {},
  ) {
    let combo = this.combos.get(name);

    if (!combo) {
      if (name.length === 1) {
        // single keys
        this.add(name, name);
        combo = name;
      } else {
        throw new Error(`Error registering input, combo ${name}: not found.`);
      }
    }

    Mousetrap.bind(
      combo,
      () => {
        if (this.namespace === namespace || namespace === '*') {
          callback();
        }
      },
      occasion,
    );
  }

  unbind(name: string) {
    const combo = this.combos.get(name);
    if (combo) Mousetrap.unbind(combo);
  }

  setNamespace(namespace: InputNamespace) {
    this.namespace = namespace;
  }
}

export { Inputs };
