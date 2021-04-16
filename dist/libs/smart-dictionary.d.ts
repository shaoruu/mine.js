declare class SmartDictionary<T> {
    data: T[];
    indices: Map<string, number>;
    constructor();
    set(name: string, item: T): number | undefined;
    setByIndex(index: number, item: T): number;
    getIndex(name: string): number;
    get(name: string): T | null;
    getByIndex(index: number): T;
    delete(name: string): boolean;
    has(name: string): boolean;
    exists(item: T): boolean;
    toIndexMap(): {
        [key: number]: T;
    };
    toObject(): {
        [key: string]: T;
    };
}
export { SmartDictionary };
