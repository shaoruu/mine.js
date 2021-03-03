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
  }

  getIndex(name: string) {
    const index = this.indices.get(name);
    return index === undefined ? -1 : index;
  }

  get(name: string) {
    const index = this.getIndex(name);
    return this.data[index] || null;
  }
}

export { SmartDictionary };
