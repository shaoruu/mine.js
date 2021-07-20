import { Helper } from '../utils';

import { Engine } from '.';

import '../styles/inventory.css';

type InventoryOptionsType = {
  backpackColumns: number;
  backpackRows: number;
  hotbarSlots: number;
};

class Slot extends HTMLDivElement {
  public type: number;

  public isEmpty = true;
  public isFull = false;

  constructor() {
    super();
  }
}

const TEMP_BLOCK_MAP = [1, 2, 3, 4, 100, 10, 12, 13, 14, 15];
const SLOT_SIZE = 40; // px
const BORDER_COLOR = '#393B44';

class Inventory {
  // NOTE: should be within [0, hotbarSlots]
  public handIndex = 0;

  public inventory: Slot[][] = [];
  public hotbar: Slot[] = [];

  public gui: {
    wrapper: HTMLDivElement;
    backpack: HTMLDivElement;
    hotbar: HTMLDivElement;
  };

  constructor(public engine: Engine, public options: InventoryOptionsType) {
    this.makeDOM();

    for (let i = 1; i < this.options.hotbarSlots + 1; i++) {
      const iStr = i.toString();
      engine.inputs.add(iStr, iStr);
      engine.inputs.bind(
        iStr,
        () => {
          this.setHandIndex(i - 1);
        },
        'in-game',
      );
    }

    engine.inputs.scroll(
      () => this.setHandIndex(this.handIndex + 1),
      () => this.setHandIndex(this.handIndex - 1),
      'in-game',
    );

    engine.on('focus-loaded', () => {
      this.updateDOM();
    });
  }

  makeDOM = () => {
    const { hotbarSlots } = this.options;

    const { wrapper, backpack, hotbar } = (this.gui = {
      wrapper: document.createElement('div'),
      backpack: document.createElement('div'),
      hotbar: document.createElement('div'),
    });

    Helper.applyStyle(wrapper, {
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: '0',
      left: '0',
      zIndex: '3',
      // visibility: 'hidden',
    });

    Helper.applyStyle(hotbar, {
      position: 'absolute',
      bottom: `${SLOT_SIZE / 4}px`,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });

    for (let i = 0; i < hotbarSlots; i++) {
      const slot = document.createElement('div') as Slot;

      if (i === this.handIndex) {
        slot.classList.add('selected-slot');
      }

      slot.type = TEMP_BLOCK_MAP[i];

      Helper.applyStyle(slot, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${SLOT_SIZE * 0.1}px`,
        margin: `${SLOT_SIZE * 0.02}px`,
        borderRadius: `${SLOT_SIZE * 0.1}px`,
        width: `${SLOT_SIZE}px`,
        height: `${SLOT_SIZE}px`,
        background: 'rgba(84, 140, 168, 0.05)',
        border: `${SLOT_SIZE * 0.08}px solid ${BORDER_COLOR}`,
        boxShadow: `inset 0 0 ${SLOT_SIZE * 0.05}px ${BORDER_COLOR}`,
      });

      hotbar.appendChild(slot);
      this.hotbar.push(slot);
    }

    wrapper.appendChild(backpack);
    wrapper.appendChild(hotbar);

    this.engine.container.domElement.appendChild(wrapper);
  };

  updateDOM = (index?: number) => {
    const toUpdate = [];

    if (index) toUpdate.push(this.hotbar[index]);
    else toUpdate.push(...this.hotbar);

    toUpdate.forEach((slot) => {
      slot.innerHTML = '';

      // ? should i make a new image every single time?
      const imgSrc = this.engine.registry.getFocus(slot.type);
      const img = document.createElement('img');

      img.src = imgSrc;
      img.width = SLOT_SIZE * 0.8;
      img.height = SLOT_SIZE * 0.8;

      slot.appendChild(img);
    });
  };

  setHand = (type: number) => {
    this.hotbar[this.handIndex].type = type;
    this.updateDOM(this.handIndex);
  };

  setHandIndex = (i: number) => {
    this.hotbar[this.handIndex].classList.remove('selected-slot');
    // to keep it always positive.
    this.handIndex = (i + this.hotbar.length) % this.hotbar.length;
    this.hotbar[this.handIndex].classList.add('selected-slot');
  };

  select = (index: number) => {
    if (index < 0 || index > this.options.hotbarSlots) {
      console.error('Index out of bounds for selecting hotbar.');
      return;
    }

    this.handIndex = index;
    this.updateDOM();
  };

  get hand() {
    return this.hotbar[this.handIndex].type;
  }
}

export { Inventory, InventoryOptionsType };
