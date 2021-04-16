import { SmartDictionary } from './smart-dictionary';
declare type ClockOptions = {
    maxDelta: number;
};
declare class Clock {
    lastFrameTime: number;
    delta: number;
    options: ClockOptions;
    intervals: SmartDictionary<number>;
    constructor(options?: Partial<ClockOptions>);
    tick(): void;
    registerInterval(name: string, func: () => void, interval: number): number;
    clearInterval(name: string): boolean;
    hasInterval(name: string): boolean;
}
export { Clock };
