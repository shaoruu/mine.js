/** helper to swap item to end and pop(), instead of splice()ing */
export declare function removeUnorderedListItem<T>(list: T[], item: T): void;
/** loop over a function for a few ms, or until it returns true */
export declare function loopForTime<T>(maxTimeInMS: number, callback: () => T, startTime?: number): void;
export declare function numberOfVoxelsInSphere(rad: number): number;
/**
 * partly "unrolled" loops to copy contents of ndarrays
 * when there's no source, zeroes out the array instead
 */
export declare function copyNdarrayContents(src: any, tgt: any, pos: [number, number, number], size: [number, number, number], tgtPos: [number, number, number]): void;
/**
 * simple thing for reporting time split up between several activities
 */
export declare function makeProfileHook(_every: number, _title: string): (state: any) => void;
/**
 * simple thing for reporting time actions/sec
 */
export declare function makeThroughputHook(_every: number, _title: string): (state: any) => void;
/**
 * strList - internal data structure for lists of chunk IDs
 */
export declare class StringList {
    arr: string[];
    hash: {
        [key: string]: boolean;
    };
    includes: (key: string) => boolean;
    add: (key: string) => void;
    remove: (key: string) => void;
    count: () => number;
    forEach: (callbackfn: (value: string, index: number, array: string[]) => void, thisArg?: any) => void;
    slice: (start?: number | undefined, end?: number | undefined) => string[];
    isEmpty: () => boolean;
    empty: () => void;
    pop: () => string;
    sort: (keyToDistanceFn: (key: string) => number) => void;
    copyFrom: (list: StringList) => void;
}
