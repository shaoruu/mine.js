class SmartDictionary<T> {
  public data: T[];
  public indices: Map<string, number>;

  constructor() {
    this.data = [];
    this.indices = new Map();
  }

  set(name: string, item: T) {
    // TODO: must be better way of doing this
    if (!isNaN(this.indices.get(name) as never)) {
      const index = this.indices.get(name);
      this.data[index as never] = item;
      return index;
    }

    const index = this.data.length;
    this.data[index] = item;
    this.indices.set(name, index);

    return index;
  }

  setByIndex(index: number, item: T) {
    this.data[index] = item;
    return index;
  }

  getIndex(name: string) {
    const index = this.indices.get(name);
    return index === undefined ? -1 : index;
  }

  get(name: string) {
    const index = this.getIndex(name);
    return this.data[index] || null;
  }

  getByIndex(index: number) {
    return this.data[index];
  }

  delete(name: string) {
    // TODO: figure out a way to remove data too
    return this.indices.delete(name);
  }

  has(name: string) {
    return this.indices.has(name);
  }

  toIndexMap() {
    const obj: { [key: number]: T } = {};
    this.indices.forEach((value) => {
      obj[value] = this.data[value];
    });
    return obj;
  }

  toObject() {
    const obj: { [key: string]: T } = {};
    this.indices.forEach((value, key) => {
      const entry = this.data[value];
      obj[key] = entry;
    });
    return obj;
  }
}

export { SmartDictionary };
