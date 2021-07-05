import { Engine } from '.';

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

class Inventory {
  // NOTE: should be within [0, hotbarSlots]
  public hand = 0;

  public inventory: Slot[][] = [];
  public hotbars: Slot[] = [];

  public gui: {
    wrapper: HTMLDivElement;
    backpack: HTMLDivElement;
    hotbar: HTMLDivElement;
  };

  constructor(public engine: Engine, public options: InventoryOptionsType) {
    this.makeDOM();
  }

  makeDOM = () => {};

  updateDOM = () => {};

  select = (index: number) => {
    if (index < 0 || index > this.options.hotbarSlots) {
      console.error('Index out of bounds for selecting hotbar.');
      return;
    }

    this.hand = index;
    this.updateDOM();
  };
}

export { Inventory, InventoryOptionsType };
