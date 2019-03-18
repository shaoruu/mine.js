export declare class InvariantError extends Error {
    framesToPop: number;
    name: string;
    constructor(message?: string | number);
}
export declare function invariant(condition: any, message?: string | number): void;
export declare namespace invariant {
    function warn(...args: any[]): void;
    function error(...args: any[]): void;
}
export default invariant;
