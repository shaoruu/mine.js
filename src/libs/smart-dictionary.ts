class SmartDictionary<T> {
  public data: T[];
  public indices: Map<string, number>;

  constructor() {
    this.data = [];
    this.indices = new Map();
  }

  set(name: string, item: T) {
    if (this.indices.get(name)) return;

    const index = this.data.length;
    this.data.push(item);
    this.indices.set(name, index);

    return index;
  }

  setByIndex(index: number, item: T) {
    if (!this.data[index]) return;
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
